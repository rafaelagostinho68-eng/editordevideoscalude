import { ActionForm, Field } from "@/components/admin/ActionForm";
import { RowsEditor, type Row } from "@/components/admin/RowsEditor";
import { saveGroup } from "@/app/admin/(panel)/adicionais/actions";

export type GroupFormData = {
  id?: number; name: string; description: string; required: boolean; minSelect: number; maxSelect: number; active: boolean;
  options: Row[]; productIds: number[];
};

export function GroupForm({ data, productsByCategory }: { data: GroupFormData; productsByCategory: { category: string; products: { id: number; name: string }[] }[] }) {
  return (
    <ActionForm action={saveGroup} submit={data.id ? "Salvar grupo" : "Criar grupo"} className="space-y-6">
      {data.id && <input type="hidden" name="id" value={data.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Nome do grupo" hint="Ex.: Molho extra, Escolha o tempero" className="sm:col-span-2"><input id="name" name="name" defaultValue={data.name} className="field" maxLength={80} required /></Field>
        <Field name="description" label="Texto de ajuda (opcional)" className="sm:col-span-2"><input id="description" name="description" defaultValue={data.description} className="field" maxLength={200} /></Field>
        <Field name="minSelect" label="Mínimo de escolhas"><input id="minSelect" name="minSelect" type="number" min={0} max={50} defaultValue={data.minSelect} className="field" /></Field>
        <Field name="maxSelect" label="Máximo de escolhas" hint="1 = escolha única; mais de 1 = várias opções."><input id="maxSelect" name="maxSelect" type="number" min={1} max={50} defaultValue={data.maxSelect} className="field" /></Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface2 p-3"><input type="checkbox" name="required" defaultChecked={data.required} className="chk" /><span className="text-sm"><span className="font-semibold">Obrigatório</span><span className="block text-xs text-muted">O cliente precisa escolher (mínimo 1).</span></span></label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface2 p-3"><input type="checkbox" name="active" defaultChecked={data.active} className="chk" /><span className="text-sm"><span className="font-semibold">Grupo ativo</span><span className="block text-xs text-muted">Desmarque para esconder sem apagar.</span></span></label>
      </div>

      <div>
        <h3 className="lbl">Opções</h3>
        <RowsEditor name="options" initial={data.options} blank={{ id: null, name: "", price: "", active: true }} addLabel="Adicionar opção" emptyText="Nenhuma opção ainda."
          columns={[{ key: "name", label: "Nome da opção", kind: "text", wide: true, maxLength: 80 }, { key: "price", label: "Preço extra (R$)", kind: "money", placeholder: "vazio = grátis" }, { key: "active", label: "Ativa", kind: "bool" }]} />
        <p className="hint">Só cadastre adicionais com preço depois de confirmado com o restaurante.</p>
      </div>

      <fieldset>
        <legend className="lbl">Produtos que oferecem este grupo</legend>
        <div className="space-y-4">
          {productsByCategory.map((c) => (
            <div key={c.category}>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gold-soft">{c.category}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {c.products.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface2 px-3 py-2.5"><input type="checkbox" name="productIds" value={p.id} defaultChecked={data.productIds.includes(p.id)} className="chk" /><span className="text-sm">{p.name}</span></label>
                ))}
              </div>
            </div>
          ))}
          {productsByCategory.length === 0 && <p className="text-sm text-muted">Cadastre produtos primeiro.</p>}
        </div>
      </fieldset>
    </ActionForm>
  );
}
