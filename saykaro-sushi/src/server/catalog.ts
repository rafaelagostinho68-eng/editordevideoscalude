import { db } from "./db";
import type { CatalogProduct } from "@/lib/pricing";

export type MenuOption = { id: number; name: string; priceCents: number };
export type MenuGroup = { id: number; name: string; description: string | null; required: boolean; minSelect: number; maxSelect: number; options: MenuOption[] };
export type MenuProduct = {
  id: number; categoryId: number; name: string; description: string | null; portion: string | null; priceCents: number;
  soldOut: boolean; featured: boolean; isNew: boolean; imageUrl: string | null; thumbUrl: string | null; imageAlt: string | null;
  groups: MenuGroup[];
};
export type MenuCategory = { id: number; name: string; slug: string; description: string | null };
export type MenuData = { categories: MenuCategory[]; products: MenuProduct[] };

/** Cardápio público: só categorias/produtos ativos. Esgotado aparece, porém indisponível. */
export async function getMenu(): Promise<MenuData> {
  const [cats, prods] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.product.findMany({
      where: { active: true, category: { active: true } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        modifiers: { orderBy: { sortOrder: "asc" }, include: { group: { include: { options: { where: { active: true }, orderBy: { sortOrder: "asc" } } } } } },
      },
    }),
  ]);
  const used = new Set(prods.map((p) => p.categoryId));
  return {
    categories: cats.filter((c) => used.has(c.id)).map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description })),
    products: prods.map((p) => ({
      id: p.id, categoryId: p.categoryId, name: p.name, description: p.description, portion: p.portion, priceCents: p.priceCents,
      soldOut: p.soldOut, featured: p.featured, isNew: p.isNew,
      imageUrl: p.images[0] ? `/media/${p.images[0].path}` : null,
      thumbUrl: p.images[0] ? `/media/${p.images[0].thumbPath}` : null,
      imageAlt: p.images[0]?.alt ?? p.name,
      groups: p.modifiers.filter((m) => m.group.active && m.group.options.length > 0).map((m) => ({
        id: m.group.id, name: m.group.name, description: m.group.description, required: m.group.required,
        minSelect: m.group.minSelect, maxSelect: m.group.maxSelect,
        options: m.group.options.map((o) => ({ id: o.id, name: o.name, priceCents: o.priceCents })),
      })),
    })),
  };
}

/** Catálogo para o motor de preços (valida disponibilidade e preço NO SERVIDOR). */
export async function getPricingCatalog(productIds: number[]): Promise<Map<number, CatalogProduct>> {
  const rows = await db.product.findMany({
    where: { id: { in: [...new Set(productIds)] } },
    include: { category: true, modifiers: { include: { group: { include: { options: true } } } } },
  });
  return new Map(rows.map((p) => [p.id, {
    id: p.id, name: p.name, portion: p.portion, priceCents: p.priceCents,
    active: p.active && p.category.active, soldOut: p.soldOut,
    groups: p.modifiers.map((m) => ({
      id: m.group.id, name: m.group.name, required: m.group.required, minSelect: m.group.minSelect, maxSelect: m.group.maxSelect, active: m.group.active,
      options: m.group.options.map((o) => ({ id: o.id, name: o.name, priceCents: o.priceCents, active: o.active })),
    })),
  } satisfies CatalogProduct]));
}
