import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { ImageError, MAX_UPLOAD_BYTES, removeFiles, storeProductImage } from "@/server/images";
import { requireAdminApi, sameOriginOk } from "@/server/auth/session";

export const dynamic = "force-dynamic";

async function gate() {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  if (!(await sameOriginOk())) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  return null;
}

const refresh = (id: number) => { revalidatePath("/", "layout"); revalidatePath(`/admin/produtos/${id}`); revalidatePath("/admin/produtos"); };

/** Envia/substitui a foto do produto (multipart, campo "file"). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await gate();
  if (denied) return denied;
  const productId = Number((await params).id);
  if (!Number.isInteger(productId)) return Response.json({ error: "Produto inválido." }, { status: 400 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 512 * 1024) return Response.json({ error: "A imagem passa de 5 MB." }, { status: 413 });
  if (!(await db.product.findUnique({ where: { id: productId }, select: { id: true } }))) return Response.json({ error: "Produto não encontrado." }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Envie uma imagem." }, { status: 400 });
  try {
    const saved = await storeProductImage(Buffer.from(await file.arrayBuffer()));
    const old = await db.productImage.findMany({ where: { productId } });
    await db.$transaction([
      db.productImage.deleteMany({ where: { productId } }),
      db.productImage.create({ data: { productId, path: saved.path, thumbPath: saved.thumbPath, width: saved.width, height: saved.height } }),
    ]);
    await removeFiles(...old.flatMap((i) => [i.path, i.thumbPath]));
    refresh(productId);
    return Response.json({ url: `/media/${saved.path}` });
  } catch (e) {
    if (e instanceof ImageError) return Response.json({ error: e.message }, { status: 422 });
    console.error("upload de imagem falhou", e);
    return Response.json({ error: "Não foi possível processar a imagem." }, { status: 500 });
  }
}

/** Remove a foto (o produto volta a mostrar o placeholder elegante). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await gate();
  if (denied) return denied;
  const productId = Number((await params).id);
  if (!Number.isInteger(productId)) return Response.json({ error: "Produto inválido." }, { status: 400 });
  const old = await db.productImage.findMany({ where: { productId } });
  await db.productImage.deleteMany({ where: { productId } });
  await removeFiles(...old.flatMap((i) => [i.path, i.thumbPath]));
  refresh(productId);
  return Response.json({ ok: true });
}
