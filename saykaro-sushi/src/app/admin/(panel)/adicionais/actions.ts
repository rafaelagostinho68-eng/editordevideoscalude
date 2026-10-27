"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { db } from "@/server/db";
import { guard } from "@/server/admin/guard";
import { fail, flag, ok, refreshPublic, str, zodFields, type FormState } from "@/server/admin/form";
import { modifierGroupSchema, optionRowSchema } from "@/lib/admin-schemas";
import { parseBRLToCents } from "@/lib/money";

function done(id?: number) {
  refreshPublic();
  revalidatePath("/admin/adicionais");
  if (id) revalidatePath(`/admin/adicionais/${id}`);
}

export async function saveGroup(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = str(fd, "id") ? Number(str(fd, "id")) : null;
  const required = flag(fd, "required");
  const parsed = modifierGroupSchema.safeParse({ name: str(fd, "name"), description: str(fd, "description"), minSelect: str(fd, "minSelect") || "0", maxSelect: str(fd, "maxSelect") || "1" });
  if (!parsed.success) return fail("Confira os campos destacados.", zodFields(parsed.error));
  const g = { ...parsed.data, minSelect: required ? Math.max(1, parsed.data.minSelect) : parsed.data.minSelect };
  if (g.minSelect > g.maxSelect) return fail("O mínimo não pode ser maior que o máximo.", { minSelect: "O mínimo não pode ser maior que o máximo." });

  let raw: unknown[] = [];
  try { const v = JSON.parse(str(fd, "options")); if (Array.isArray(v) && v.length <= 100) raw = v; else return fail("Opções inválidas."); } catch { return fail("Opções inválidas."); }
  const options: z.infer<typeof optionRowSchema>[] = [];
  for (const [i, r] of raw.entries()) {
    const o = r as Record<string, unknown>;
    const price = String(o.price ?? "").trim() === "" ? 0 : parseBRLToCents(String(o.price));
    const row = optionRowSchema.safeParse({ id: typeof o.id === "number" && o.id > 0 ? o.id : null, name: String(o.name ?? ""), priceCents: price ?? -1, active: o.active !== false });
    if (!row.success) return fail(`Opção ${i + 1}: informe o nome e, se houver, o preço (ex.: 3,00). Deixe o preço vazio para opção sem custo.`);
    options.push(row.data);
  }
  if (g.minSelect > options.filter((o) => o.active).length) return fail("O mínimo exigido é maior que o número de opções ativas.");

  const productIds = [...new Set(fd.getAll("productIds").map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  const validProducts = (await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true } })).map((p) => p.id);

  const groupId = await db.$transaction(async (tx) => {
    let gid = id;
    const data = { name: g.name, description: g.description, required, minSelect: g.minSelect, maxSelect: g.maxSelect, active: flag(fd, "active") };
    if (gid) {
      await tx.modifierGroup.update({ where: { id: gid }, data });
    } else {
      const max = await tx.modifierGroup.aggregate({ _max: { sortOrder: true } });
      gid = (await tx.modifierGroup.create({ data: { ...data, sortOrder: (max._max.sortOrder ?? 0) + 10 } })).id;
    }
    const keep = options.map((o) => o.id).filter((x): x is number => x !== null);
    await tx.modifierOption.deleteMany({ where: { groupId: gid, id: { notIn: keep } } });
    for (const [i, o] of options.entries()) {
      const d = { name: o.name, priceCents: o.priceCents, active: o.active, sortOrder: i };
      if (o.id) await tx.modifierOption.updateMany({ where: { id: o.id, groupId: gid }, data: d });
      else await tx.modifierOption.create({ data: { ...d, groupId: gid } });
    }
    await tx.productModifierGroup.deleteMany({ where: { groupId: gid } });
    await tx.productModifierGroup.createMany({ data: validProducts.map((productId) => ({ productId, groupId: gid!, sortOrder: 0 })) });
    return gid;
  });
  done(groupId);
  if (!id) redirect(`/admin/adicionais/${groupId}?criado=1`);
  return ok("Grupo salvo.");
}

export async function deleteGroup(id: number): Promise<void> {
  await guard();
  await db.modifierGroup.delete({ where: { id } }).catch(() => {});
  done();
  redirect("/admin/adicionais");
}
