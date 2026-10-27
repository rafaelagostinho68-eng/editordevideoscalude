import Link from "next/link";
import { Camera, Plus } from "lucide-react";
import { QuickMenu } from "@/components/admin/QuickMenu";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const FILTERS = { esgotados: "soldout", ocultos: "hidden", semfoto: "nophoto" } as const;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const [cats, products] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.product.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } }),
  ]);
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cardápio</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">Cada mudança vale na hora para os clientes. Toque no nome ou no preço para editar, nos interruptores para esgotar ou ocultar, e na foto para trocar.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Link href="/admin/fotos" className="btn"><Camera size={18} /> Fotos</Link>
          <Link href="/admin/produtos/novo" className="btn btn-primary"><Plus size={18} /> Novo produto</Link>
        </div>
      </header>
      <QuickMenu
        categories={cats.map((c) => ({ id: c.id, name: c.name, active: c.active }))}
        products={products.map((p) => ({
          id: p.id, categoryId: p.categoryId, name: p.name, priceCents: p.priceCents, portion: p.portion, active: p.active, soldOut: p.soldOut,
          featured: p.featured, isNew: p.isNew, thumb: p.images[0] ? `/media/${p.images[0].thumbPath}` : null,
        }))}
        initialFilter={estado && estado in FILTERS ? FILTERS[estado as keyof typeof FILTERS] : undefined}
      />
    </div>
  );
}
