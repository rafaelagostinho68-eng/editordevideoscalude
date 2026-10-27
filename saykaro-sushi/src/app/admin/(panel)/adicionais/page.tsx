import Link from "next/link";
import { Plus } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const groups = await db.modifierGroup.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { options: { orderBy: { sortOrder: "asc" } }, _count: { select: { products: true } } },
  });
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Adicionais e opções</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">Grupos de opções que aparecem ao abrir um produto (ex.: molhos, adicionais pagos, escolha de tempero). Nada é cadastrado por conta própria: só o que você confirmar com o restaurante.</p>
        </div>
        <Link href="/admin/adicionais/novo" className="btn btn-primary"><Plus size={18} /> Novo grupo</Link>
      </header>
      <ul className="space-y-3">
        {groups.map((g) => (
          <li key={g.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/admin/adicionais/${g.id}`} className="font-semibold hover:underline">{g.name}</Link>
              {g.required && <span className="chip chip-warn">Obrigatório</span>}
              {!g.active && <span className="chip">Inativo</span>}
              <span className="chip">{g._count.products} produto{g._count.products === 1 ? "" : "s"}</span>
              <Link href={`/admin/adicionais/${g.id}`} className="btn btn-sm ml-auto">Editar</Link>
            </div>
            <p className="mt-2 text-sm text-muted">
              {g.options.length === 0 ? "Sem opções." : g.options.map((o) => `${o.name}${o.priceCents ? ` (+${formatBRL(o.priceCents)})` : ""}`).join(" · ")}
            </p>
          </li>
        ))}
        {groups.length === 0 && <li className="card text-sm text-muted">Nenhum grupo cadastrado. O cardápio funciona normalmente sem adicionais.</li>}
      </ul>
    </div>
  );
}
