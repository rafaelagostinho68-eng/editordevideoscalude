import { Check, RotateCcw } from "lucide-react";
import { ActionForm, Field } from "@/components/admin/ActionForm";
import { db } from "@/server/db";
import { addPending, setPendingResolved } from "./actions";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const items = await db.catalogPending.findMany({ orderBy: [{ resolved: "asc" }, { id: "asc" }] });
  const open = items.filter((i) => !i.resolved);
  const closed = items.filter((i) => i.resolved);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Pendências para confirmar</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Itens do material original que ficaram <strong>fora do cardápio publicado</strong> por falta de confirmação (preços, opções, nomes, horários…). Nada aqui foi inventado: quando o restaurante confirmar, cadastre em Produtos / Adicionais / Restaurante e marque como resolvida.
        </p>
      </header>

      <section aria-label="Em aberto" className="space-y-3">
        <h2 className="font-semibold">Em aberto ({open.length})</h2>
        {open.map((i) => (
          <article key={i.id} className="card">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{i.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{i.details}</p>
                {i.source && <p className="mt-1 text-xs text-muted">Origem: {i.source}</p>}
              </div>
              <form action={setPendingResolved.bind(null, i.id, true)}><button className="btn btn-sm" title="Marcar como resolvida"><Check size={16} /> Resolvida</button></form>
            </div>
          </article>
        ))}
        {open.length === 0 && <p className="card text-sm text-muted">Nenhuma pendência em aberto.</p>}
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Anotar nova pendência</h2>
        <ActionForm action={addPending} resetOnSuccess submit="Anotar">
          <Field name="title" label="Título"><input id="title" name="title" className="field" maxLength={120} required /></Field>
          <Field name="details" label="Detalhes"><textarea id="details" name="details" className="field" maxLength={600} /></Field>
        </ActionForm>
      </section>

      {closed.length > 0 && (
        <section aria-label="Resolvidas" className="space-y-2">
          <h2 className="font-semibold text-muted">Resolvidas ({closed.length})</h2>
          {closed.map((i) => (
            <div key={i.id} className="card flex items-center gap-3 opacity-70">
              <span className="min-w-0 flex-1 truncate text-sm line-through">{i.title}</span>
              <form action={setPendingResolved.bind(null, i.id, false)}><button className="btn btn-sm" title="Reabrir"><RotateCcw size={16} /> Reabrir</button></form>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
