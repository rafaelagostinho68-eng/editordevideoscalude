import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ProductForm, productToForm } from "@/components/admin/ProductForm";
import { db } from "@/server/db";
import { deleteProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [p, categories, groups, ordersCount] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, modifiers: true } }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true, name: true } }),
    db.modifierGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { _count: { select: { options: true } } } }),
    db.orderItem.count({ where: { productId: id } }),
  ]);
  if (!p) notFound();
  const created = (await searchParams).criado === "1";
  const img = p.images[0];

  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/produtos" className="text-sm text-muted hover:text-ink">← Produtos</Link>
        <h1 className="mt-1 font-display text-2xl font-bold">{p.name}</h1>
        {created && <p className="mt-2 rounded-xl border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok" role="status">Produto criado! Agora você pode enviar a foto abaixo.</p>}
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
        <section className="card order-2 lg:order-1">
          <ProductForm
            data={productToForm(p, p.modifiers.map((m) => m.groupId))}
            categories={categories}
            groups={groups.map((g) => ({ id: g.id, name: g.name, required: g.required, active: g.active, optionCount: g._count.options }))}
          />
        </section>
        <div className="order-1 space-y-5 lg:order-2">
          <section className="card">
            <h2 className="mb-3 font-semibold">Foto do produto</h2>
            <ImageUploader endpoint={`/api/admin/products/${p.id}/image`} imageUrl={img ? `/media/${img.path}` : null} name={p.name} />
          </section>
          <section className="card">
            <h2 className="mb-1 font-semibold">Excluir produto</h2>
            <p className="mb-3 text-sm text-muted">
              {ordersCount > 0
                ? `Este produto aparece em ${ordersCount} item(ns) de pedidos antigos. Eles continuam intactos (nome e preço ficam registrados no pedido), mas o produto some do cardápio. Se for temporário, prefira “Ocultar”.`
                : "Remove o produto e a foto. Se for temporário, prefira ocultar ou marcar como esgotado."}
            </p>
            <form action={deleteProduct.bind(null, p.id)}><ConfirmButton message={`Excluir "${p.name}" definitivamente?`} className="btn btn-danger"><Trash2 size={16} /> Excluir produto</ConfirmButton></form>
          </section>
        </div>
      </div>
    </div>
  );
}
