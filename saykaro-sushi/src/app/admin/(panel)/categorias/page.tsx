import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "lucide-react";
import { ActionForm, Field } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { db } from "@/server/db";
import { createCategory, deleteCategory, moveCategory, renameCategory, toggleCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const cats = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Categorias</h1>
        <p className="mt-1 text-sm text-muted">Definem as abas do cardápio. A ordem abaixo é a ordem exibida aos clientes. Categorias ocultas (ou sem produtos visíveis) não aparecem no cardápio.</p>
      </header>

      <section className="card">
        <h2 className="mb-3 font-semibold">Nova categoria</h2>
        <ActionForm action={createCategory} resetOnSuccess submit="Criar categoria" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field name="name" label="Nome"><input id="name" name="name" className="field" maxLength={60} required placeholder="Ex.: Sobremesas" /></Field>
          <Field name="description" label="Descrição (opcional)"><input id="description" name="description" className="field" maxLength={200} /></Field>
        </ActionForm>
      </section>

      <ul className="space-y-3">
        {cats.map((c, i) => (
          <li key={c.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{c._count.products} produto{c._count.products === 1 ? "" : "s"}</span>
              {!c.active && <span className="chip chip-warn">Oculta</span>}
              <div className="ml-auto flex items-center gap-1.5">
                <form action={moveCategory.bind(null, c.id, "up")}><button className="btn btn-sm" disabled={i === 0} aria-label={`Subir ${c.name}`}><ArrowUp size={16} /></button></form>
                <form action={moveCategory.bind(null, c.id, "down")}><button className="btn btn-sm" disabled={i === cats.length - 1} aria-label={`Descer ${c.name}`}><ArrowDown size={16} /></button></form>
                <form action={toggleCategory.bind(null, c.id, !c.active)}>
                  <button className="btn btn-sm" aria-label={c.active ? `Ocultar ${c.name}` : `Mostrar ${c.name}`}>{c.active ? <><EyeOff size={16} /> Ocultar</> : <><Eye size={16} /> Mostrar</>}</button>
                </form>
                {c._count.products === 0 && (
                  <form action={deleteCategory.bind(null, c.id)}><ConfirmButton message={`Excluir a categoria "${c.name}"?`}><Trash2 size={16} /> Excluir</ConfirmButton></form>
                )}
              </div>
            </div>
            <ActionForm action={renameCategory} submit="Salvar" className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" submitClass="btn btn-sm">
              <input type="hidden" name="id" value={c.id} />
              <Field name="name" id={`n${c.id}`} label="Nome"><input id={`n${c.id}`} name="name" defaultValue={c.name} className="field" maxLength={60} required /></Field>
              <Field name="description" id={`d${c.id}`} label="Descrição"><input id={`d${c.id}`} name="description" defaultValue={c.description ?? ""} className="field" maxLength={200} /></Field>
            </ActionForm>
            {c._count.products > 0 && <p className="hint">Para excluir, mova ou exclua antes os produtos desta categoria — ou apenas oculte-a.</p>}
          </li>
        ))}
        {cats.length === 0 && <li className="card text-sm text-muted">Nenhuma categoria ainda.</li>}
      </ul>
    </div>
  );
}
