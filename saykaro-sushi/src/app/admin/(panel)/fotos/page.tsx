import Link from "next/link";
import { BulkPhotos } from "@/components/admin/BulkPhotos";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const products = await db.product.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { id: "asc" }],
    include: { category: true, images: { take: 1, select: { id: true } } },
  });
  const without = products.filter((p) => p.images.length === 0);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Fotos dos produtos</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          {without.length === 0 ? "Todos os produtos têm foto." : <>{without.length} de {products.length} produtos ainda estão sem foto (aparecem com uma ilustração no cardápio).</>} Prefira fotos de cima ou a 45°, com luz natural e o prato centralizado: o sistema recorta em 4:3 mantendo o centro.
        </p>
        <p className="mt-2 text-sm text-muted">Para trocar a foto de um produto só, use a lista em <Link href="/admin/produtos" className="underline">Cardápio</Link> e toque na foto.</p>
      </header>
      <BulkPhotos products={products.map((p) => ({ id: p.id, name: p.name, category: p.category.name, hasPhoto: p.images.length > 0 }))} />
      {without.length > 0 && (
        <section className="card">
          <h2 className="mb-2 font-semibold">Ainda sem foto ({without.length})</h2>
          <ul className="grid gap-x-6 gap-y-1 text-sm text-muted sm:grid-cols-2">
            {without.map((p) => <li key={p.id}><span className="text-ink">{p.name}</span> · {p.category.name}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
