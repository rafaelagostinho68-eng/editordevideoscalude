"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { guard } from "@/server/admin/guard";
import { fail, flag, ok, refreshPublic, str, zodFields, type FormState } from "@/server/admin/form";
import { productSchema } from "@/lib/admin-schemas";
import { slugify } from "@/lib/slug";
import { removeFiles } from "@/server/images";

async function uniqueSlug(name: string) {
  const base = slugify(name);
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (!(await db.product.findUnique({ where: { slug } }))) return slug;
  }
}

function done(id?: number) {
  refreshPublic();
  revalidatePath("/admin/produtos");
  if (id) revalidatePath(`/admin/produtos/${id}`);
}

export async function saveProduct(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const idRaw = str(fd, "id");
  const id = idRaw ? Number(idRaw) : null;
  const rawOrder = str(fd, "sortOrder");
  const parsed = productSchema.safeParse({
    name: str(fd, "name"), categoryId: str(fd, "categoryId"), description: str(fd, "description"),
    portion: str(fd, "portion"), price: str(fd, "price"), sortOrder: rawOrder === "" ? "0" : rawOrder,
  });
  if (!parsed.success) return fail("Confira os campos destacados.", zodFields(parsed.error));
  const v = parsed.data;
  if (!(await db.category.findUnique({ where: { id: v.categoryId } }))) return fail("Categoria inválida.", { categoryId: "Escolha uma categoria." });

  const flags = { active: flag(fd, "active"), soldOut: flag(fd, "soldOut"), featured: flag(fd, "featured"), isNew: flag(fd, "isNew") };
  const groupIds = [...new Set(fd.getAll("groupIds").map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0))];
  const validGroups = (await db.modifierGroup.findMany({ where: { id: { in: groupIds } }, select: { id: true } })).map((g) => g.id);

  if (id) {
    const cur = await db.product.findUnique({ where: { id } });
    if (!cur) return fail("Produto não encontrado.");
    await db.$transaction([
      db.product.update({
        where: { id },
        data: { name: v.name, categoryId: v.categoryId, description: v.description, portion: v.portion, priceCents: v.price, sortOrder: rawOrder === "" ? cur.sortOrder : v.sortOrder, ...flags },
      }),
      db.productModifierGroup.deleteMany({ where: { productId: id } }),
      db.productModifierGroup.createMany({ data: validGroups.map((groupId, i) => ({ productId: id, groupId, sortOrder: i })) }),
    ]);
    done(id);
    return ok("Produto salvo. As mudanças já aparecem no cardápio.");
  }

  const max = await db.product.aggregate({ where: { categoryId: v.categoryId }, _max: { sortOrder: true } });
  const created = await db.product.create({
    data: {
      name: v.name, slug: await uniqueSlug(v.name), categoryId: v.categoryId, description: v.description, portion: v.portion, priceCents: v.price,
      sortOrder: rawOrder === "" ? (max._max.sortOrder ?? 0) + 10 : v.sortOrder, ...flags,
      modifiers: { create: validGroups.map((groupId, i) => ({ groupId, sortOrder: i })) },
    },
  });
  done(created.id);
  redirect(`/admin/produtos/${created.id}?criado=1`);
}

type Flag = "active" | "soldOut" | "featured" | "isNew";
export async function setProductFlag(id: number, field: Flag, value: boolean): Promise<void> {
  await guard();
  if (!["active", "soldOut", "featured", "isNew"].includes(field)) return;
  await db.product.update({ where: { id }, data: { [field]: value } }).catch(() => {});
  done(id);
}

export async function moveProduct(id: number, dir: "up" | "down"): Promise<void> {
  await guard();
  const p = await db.product.findUnique({ where: { id } });
  if (!p) return;
  const list = await db.product.findMany({ where: { categoryId: p.categoryId }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } });
  const i = list.findIndex((x) => x.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((x, idx) => db.product.update({ where: { id: x.id }, data: { sortOrder: (idx + 1) * 10 } })));
  done();
}

/** Exclui o produto. Pedidos antigos continuam intactos (guardam nome/preço/opções como "foto" do momento da compra). */
export async function deleteProduct(id: number): Promise<void> {
  await guard();
  const imgs = await db.productImage.findMany({ where: { productId: id } });
  await db.product.delete({ where: { id } }).catch(() => {});
  await removeFiles(...imgs.flatMap((i) => [i.path, i.thumbPath]));
  done();
  redirect("/admin/produtos");
}
