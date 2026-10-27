import { ActionForm, Field } from "@/components/admin/ActionForm";
import { centsToInput } from "@/lib/money";
import { saveProduct } from "@/app/admin/(panel)/produtos/actions";

export type ProductFormData = {
  id?: number; name: string; categoryId: number | null; description: string; portion: string; price: string; sortOrder: string;
  active: boolean; soldOut: boolean; featured: boolean; isNew: boolean; groupIds: number[];
};

export const emptyProduct = (categoryId: number | null): ProductFormData => ({
  name: "", categoryId, description: "", portion: "", price: "", sortOrder: "", active: true, soldOut: false, featured: false, isNew: false, groupIds: [],
});

export function productToForm(p: { id: number; name: string; categoryId: number; description: string | null; portion: string | null; priceCents: number; sortOrder: number; active: boolean; soldOut: boolean; featured: boolean; isNew: boolean }, groupIds: number[]): ProductFormData {
  return { id: p.id, name: p.name, categoryId: p.categoryId, description: p.description ?? "", portion: p.portion ?? "", price: centsToInput(p.priceCents), sortOrder: String(p.sortOrder), active: p.active, soldOut: p.soldOut, featured: p.featured, isNew: p.isNew, groupIds };
}

function Check({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface2 p-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="chk mt-0.5" />
      <span><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-muted">{hint}</span></span>
    </label>
  );
}

export function ProductForm({ data, categories, groups }: {
  data: ProductFormData;
  categories: { id: number; name: string }[];
  groups: { id: number; name: string; required: boolean; active: boolean; optionCount: number }[];
}) {
  return (
    <ActionForm action={saveProduct} submit={data.id ? "Salvar alterações" : "Criar produto"} className="space-y-5">
      {data.id && <input type="hidden" name="id" value={data.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Nome do produto" className="sm:col-span-2"><input id="name" name="name" defaultValue={data.name} className="field" maxLength={120} required /></Field>
        <Field name="categoryId" label="Categoria">
          <select id="categoryId" name="categoryId" defaultValue={data.categoryId ?? ""} className="field" required>
            <option value="" disabled>Escolha…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field name="price" label="Preço (R$)" hint="Ex.: 19,90"><input id="price" name="price" defaultValue={data.price} inputMode="decimal" className="field" placeholder="0,00" required /></Field>
        <Field name="portion" label="Porção (opcional)" hint="Ex.: 10 peças, 4 unidades. Só preencha se for informação confirmada."><input id="portion" name="portion" defaultValue={data.portion} className="field" maxLength={60} /></Field>
        <Field name="sortOrder" label="Posição na categoria" hint="Menor número aparece primeiro. Em branco = vai para o final. Também dá para reordenar com as setas na lista."><input id="sortOrder" name="sortOrder" defaultValue={data.sortOrder} inputMode="numeric" className="field" /></Field>
        <Field name="description" label="Descrição (opcional)" hint="Deixe em branco se não houver descrição confirmada — o cardápio não exibe nada." className="sm:col-span-2"><textarea id="description" name="description" defaultValue={data.description} className="field" maxLength={600} /></Field>
      </div>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="lbl mb-2">Visibilidade</legend>
        <Check name="active" label="Visível no cardápio" hint="Desmarque para ocultar sem apagar." defaultChecked={data.active} />
        <Check name="soldOut" label="Esgotado hoje" hint="Aparece no cardápio, mas não pode ser pedido." defaultChecked={data.soldOut} />
        <Check name="featured" label="Destaque" hint="Aparece na aba “Destaques”." defaultChecked={data.featured} />
        <Check name="isNew" label="Novidade" hint="Mostra a etiqueta NOVO e entra em “Destaques”." defaultChecked={data.isNew} />
      </fieldset>

      <fieldset>
        <legend className="lbl mb-2">Opções e adicionais deste produto</legend>
        {groups.length === 0 ? (
          <p className="text-sm text-muted">Nenhum grupo cadastrado. Crie em “Adicionais”.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {groups.map((g) => (
              <label key={g.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface2 p-3">
                <input type="checkbox" name="groupIds" value={g.id} defaultChecked={data.groupIds.includes(g.id)} className="chk" />
                <span className="text-sm"><span className="font-semibold">{g.name}</span> <span className="text-xs text-muted">· {g.optionCount} opç{g.optionCount === 1 ? "ão" : "ões"}{g.required ? " · obrigatório" : ""}{g.active ? "" : " · grupo desativado"}</span></span>
              </label>
            ))}
          </div>
        )}
      </fieldset>
    </ActionForm>
  );
}
