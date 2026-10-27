import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { ImageError, MAX_UPLOAD_BYTES, removeFiles, storeLogo } from "@/server/images";
import { requireAdminApi, sameOriginOk } from "@/server/auth/session";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";

async function gate() {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  if (!(await sameOriginOk())) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  return null;
}
const refresh = () => { revalidatePath("/", "layout"); revalidatePath("/admin/configuracoes"); };

export async function POST(req: Request) {
  const denied = await gate();
  if (denied) return denied;
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 512 * 1024) return Response.json({ error: "A imagem passa de 5 MB." }, { status: 413 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Envie uma imagem." }, { status: 400 });
  try {
    const name = await storeLogo(Buffer.from(await file.arrayBuffer()));
    const cur = await getSettings();
    await db.restaurantSettings.update({ where: { id: 1 }, data: { logoPath: name } });
    await removeFiles(cur.logoPath);
    refresh();
    return Response.json({ url: `/media/${name}` });
  } catch (e) {
    if (e instanceof ImageError) return Response.json({ error: e.message }, { status: 422 });
    console.error("upload do logo falhou", e);
    return Response.json({ error: "Não foi possível processar a imagem." }, { status: 500 });
  }
}

/** Volta para a logo tipográfica padrão. */
export async function DELETE() {
  const denied = await gate();
  if (denied) return denied;
  const cur = await getSettings();
  await db.restaurantSettings.update({ where: { id: 1 }, data: { logoPath: null } });
  await removeFiles(cur.logoPath);
  refresh();
  return Response.json({ ok: true });
}
