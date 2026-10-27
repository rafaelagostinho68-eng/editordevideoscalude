"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { guard } from "@/server/admin/guard";
import { fail, ok, refreshPublic, str, zodFields, type FormState } from "@/server/admin/form";
import { categorySchema } from "@/lib/admin-schemas";
import { slugify } from "@/lib/slug";

async function uniqueSlug(name: string, ignoreId?: number) {
  const base = slugify(name);
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const hit = await db.category.findUnique({ where: { slug } });
    if (!hit || hit.id === ignoreId) return slug;
  }
}

function done() {
  refreshPublic();
  revalidatePath("/admin/categorias");
}

export async function createCategory(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const parsed = categorySchema.safeParse({ name: str(fd, "name"), description: str(fd, "description") });
  if (!parsed.success) return fail("Confira o nome da categoria.", zodFields(parsed.error));
  const max = await db.category.aggregate({ _max: { sortOrder: true } });
  await db.category.create({ data: { name: parsed.data.name, description: parsed.data.description, slug: await uniqueSlug(parsed.data.name), sortOrder: (max._max.sortOrder ?? 0) + 10 } });
  done();
  return ok("Categoria criada.");
}

export async function renameCategory(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = Number(str(fd, "id"));
  const parsed = categorySchema.safeParse({ name: str(fd, "name"), description: str(fd, "description") });
  if (!parsed.success) return fail("Confira o nome.", zodFields(parsed.error));
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) return fail("Categoria não encontrada.");
  await db.category.update({ where: { id }, data: { name: parsed.data.name, description: parsed.data.description, slug: await uniqueSlug(parsed.data.name, id) } });
  done();
  return ok("Categoria atualizada.");
}

export async function toggleCategory(id: number, active: boolean): Promise<void> {
  await guard();
  await db.category.update({ where: { id }, data: { active } }).catch(() => {});
  done();
}

export async function moveCategory(id: number, dir: "up" | "down"): Promise<void> {
  await guard();
  const list = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } });
  const i = list.findIndex((c) => c.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((c, idx) => db.category.update({ where: { id: c.id }, data: { sortOrder: (idx + 1) * 10 } })));
  done();
}

export async function deleteCategory(id: number): Promise<void> {
  await guard();
  const n = await db.product.count({ where: { categoryId: id } });
  if (n > 0) return; // a tela já avisa; aqui é a trava de verdade (nunca apaga categoria com produtos)
  await db.category.delete({ where: { id } }).catch(() => {});
  done();
}
