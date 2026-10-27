import Link from "next/link";
import { ProductForm, emptyProduct } from "@/components/admin/ProductForm";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, groups] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true, name: true } }),
    db.modifierGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { _count: { select: { options: true } } } }),
  ]);
  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/produtos" className="text-sm text-muted hover:text-ink">← Produtos</Link>
        <h1 className="mt-1 font-display text-2xl font-bold">Novo produto</h1>
        <p className="mt-1 text-sm text-muted">Depois de criar, você poderá enviar a foto do produto.</p>
      </header>
      {categories.length === 0 ? (
        <p className="card text-sm">Crie primeiro uma <Link href="/admin/categorias" className="underline">categoria</Link>.</p>
      ) : (
        <div className="card">
          <ProductForm data={emptyProduct(null)} categories={categories} groups={groups.map((g) => ({ id: g.id, name: g.name, required: g.required, active: g.active, optionCount: g._count.options }))} />
        </div>
      )}
    </div>
  );
}
