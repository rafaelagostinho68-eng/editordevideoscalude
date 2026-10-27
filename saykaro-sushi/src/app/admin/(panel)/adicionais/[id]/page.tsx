import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { GroupForm } from "@/components/admin/GroupForm";
import { centsToInput } from "@/lib/money";
import { db } from "@/server/db";
import { deleteGroup } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditGroupPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [g, cats] = await Promise.all([
    db.modifierGroup.findUnique({ where: { id }, include: { options: { orderBy: { sortOrder: "asc" } }, products: true } }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { products: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true, name: true } } } }),
  ]);
  if (!g) notFound();
  const created = (await searchParams).criado === "1";
  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/adicionais" className="text-sm text-muted hover:text-ink">← Adicionais</Link>
        <h1 className="mt-1 font-display text-2xl font-bold">{g.name}</h1>
        {created && <p className="mt-2 rounded-xl border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok" role="status">Grupo criado.</p>}
      </header>
      <div className="card">
        <GroupForm
          data={{
            id: g.id, name: g.name, description: g.description ?? "", required: g.required, minSelect: g.minSelect, maxSelect: g.maxSelect, active: g.active,
            options: g.options.map((o) => ({ id: o.id, name: o.name, price: o.priceCents ? centsToInput(o.priceCents) : "", active: o.active })),
            productIds: g.products.map((p) => p.productId),
          }}
          productsByCategory={cats.map((c) => ({ category: c.name, products: c.products }))}
        />
      </div>
      <section className="card">
        <h2 className="mb-1 font-semibold">Excluir grupo</h2>
        <p className="mb-3 text-sm text-muted">Remove o grupo e suas opções dos produtos. Pedidos antigos não mudam.</p>
        <form action={deleteGroup.bind(null, g.id)}><ConfirmButton message={`Excluir o grupo "${g.name}"?`} className="btn btn-danger"><Trash2 size={16} /> Excluir grupo</ConfirmButton></form>
      </section>
    </div>
  );
}
