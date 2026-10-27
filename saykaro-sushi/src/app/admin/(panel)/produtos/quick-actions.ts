"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { guard } from "@/server/admin/guard";
import { refreshPublic } from "@/server/admin/form";

/** Edição rápida direto da lista (um campo por vez). Tudo é revalidado aqui: o navegador só manda o que quer mudar. */
const patchSchema = z
  .object({
    name: z.string().trim().min(2, "O nome precisa ter pelo menos 2 letras.").max(120).optional(),
    priceCents: z.number().int().min(1, "Informe um preço maior que zero.").max(1_000_000_00).optional(),
    active: z.boolean().optional(),
    soldOut: z.boolean().optional(),
    featured: z.boolean().optional(),
    isNew: z.boolean().optional(),
  })
  .strict();

export type QuickResult = { ok: true } | { ok: false; error: string };

export async function quickPatchProduct(id: number, patch: unknown): Promise<QuickResult> {
  await guard();
  const parsed = patchSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Valor inválido." };
  if (!Number.isInteger(id) || Object.keys(parsed.data).length === 0) return { ok: false, error: "Nada para salvar." };
  try {
    await db.product.update({ where: { id }, data: parsed.data });
  } catch {
    return { ok: false, error: "Produto não encontrado." };
  }
  refreshPublic();
  return { ok: true };
}

export async function quickCategoryActive(id: number, active: boolean): Promise<QuickResult> {
  await guard();
  try {
    await db.category.update({ where: { id }, data: { active: Boolean(active) } });
  } catch {
    return { ok: false, error: "Categoria não encontrada." };
  }
  refreshPublic();
  return { ok: true };
}

/** "Começar o dia": tira o selo de esgotado de todos os produtos de uma vez. */
export async function quickClearSoldOut(): Promise<QuickResult & { count?: number }> {
  await guard();
  const r = await db.product.updateMany({ where: { soldOut: true }, data: { soldOut: false } });
  refreshPublic();
  revalidatePath("/admin");
  return { ok: true, count: r.count };
}
