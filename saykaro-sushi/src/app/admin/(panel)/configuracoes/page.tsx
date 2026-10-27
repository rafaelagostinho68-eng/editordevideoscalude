import { ActionForm, Field } from "@/components/admin/ActionForm";
import { HourError } from "@/components/admin/HourError";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RowsEditor, type Row } from "@/components/admin/RowsEditor";
import { centsToInput } from "@/lib/money";
import { formatBRPhone } from "@/lib/phone";
import { WEEKDAY_NAMES } from "@/lib/hours";
import { db } from "@/server/db";
import { getSettings, mediaUrl } from "@/server/settings";
import { saveHours, saveIdentity, saveOperation, savePayments, saveZones } from "./actions";

export const dynamic = "force-dynamic";

function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-4">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {desc && <p className="mb-4 mt-1 text-sm text-muted">{desc}</p>}
      {!desc && <div className="mb-3" />}
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const [s, hours, zones, methods] = await Promise.all([
    getSettings(),
    db.openingHour.findMany({ orderBy: { weekday: "asc" } }),
    db.deliveryZone.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.paymentMethod.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
  ]);
  const hourOf = (d: number) => hours.find((h) => h.weekday === d);
  const zoneRows: Row[] = zones.map((z) => ({ id: z.id, name: z.name, fee: centsToInput(z.feeCents), active: z.active }));
  const payRows: Row[] = methods.map((m) => ({ id: m.id, label: m.label, instructions: m.instructions ?? "", enabled: m.enabled }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Restaurante</h1>
        <p className="mt-1 text-sm text-muted">Identidade, funcionamento, entrega e pagamento. Tudo aqui vale imediatamente para o cardápio público.</p>
        <nav className="no-scrollbar mt-3 flex gap-2 overflow-x-auto text-sm" aria-label="Seções">
          {[["#identidade", "Identidade"], ["#logo", "Logo"], ["#funcionamento", "Funcionamento"], ["#horarios", "Horários"], ["#entrega", "Entrega"], ["#pagamento", "Pagamento"]].map(([h, l]) => (
            <a key={h} href={h} className="chip shrink-0 hover:text-ink">{l}</a>
          ))}
        </nav>
      </header>

      <Section id="identidade" title="Identidade e contatos">
        <ActionForm action={saveIdentity} className="space-y-4" submit="Salvar identidade">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Nome do restaurante"><input id="name" name="name" defaultValue={s.name} className="field" maxLength={60} required /></Field>
            <Field name="tagline" label="Frase de efeito"><input id="tagline" name="tagline" defaultValue={s.tagline} className="field" maxLength={80} /></Field>
            <Field name="whatsappPrimary" label="WhatsApp principal (recebe os pedidos)" hint="Com DDD. É para este número que o pedido é enviado."><input id="whatsappPrimary" name="whatsappPrimary" defaultValue={formatBRPhone(s.whatsappPrimary)} inputMode="tel" className="field" required /></Field>
            <Field name="whatsappSecondary" label="WhatsApp secundário (opcional)"><input id="whatsappSecondary" name="whatsappSecondary" defaultValue={s.whatsappSecondary ? formatBRPhone(s.whatsappSecondary) : ""} inputMode="tel" className="field" /></Field>
            <Field name="instagram" label="Instagram (usuário)" hint="Sem @ — ex.: saykaro.sushi.delivery"><input id="instagram" name="instagram" defaultValue={s.instagram ?? ""} className="field" maxLength={60} /></Field>
            <Field name="description" label="Descrição curta" className="sm:col-span-2"><textarea id="description" name="description" defaultValue={s.description} className="field" maxLength={240} /></Field>
            <Field name="announcement" label="Aviso no topo do cardápio (opcional)" hint="Ex.: “Hoje não teremos yakissoba.” Em branco = sem aviso." className="sm:col-span-2"><input id="announcement" name="announcement" defaultValue={s.announcement ?? ""} className="field" maxLength={240} /></Field>
          </div>
        </ActionForm>
      </Section>

      <Section id="logo" title="Logo" desc="Se você não enviar uma imagem, o cardápio usa a logo tipográfica “Saykaro Sushi”.">
        <ImageUploader endpoint="/api/admin/logo" imageUrl={mediaUrl(s.logoPath)} name={s.name} variant="logo" help="JPG, PNG ou WebP, até 5 MB. Prefira fundo transparente (PNG/WebP) ou escuro; a proporção original é mantida." />
      </Section>

      <Section id="funcionamento" title="Funcionamento e pedidos">
        <ActionForm action={saveOperation} className="space-y-4" submit="Salvar funcionamento">
          <fieldset>
            <legend className="lbl">Status exibido no cardápio</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {[["AUTO", "Automático", "Segue os horários semanais abaixo."], ["OPEN", "Aberto (manual)", "Mostra “Aberto agora” até você mudar."], ["CLOSED", "Fechado (manual)", "Mostra “Fechado no momento”."]].map(([v, t, d]) => (
                <label key={v} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface2 p-3">
                  <input type="radio" name="statusMode" value={v} defaultChecked={s.statusMode === v} className="chk mt-0.5" />
                  <span><span className="block text-sm font-semibold">{t}</span><span className="block text-xs text-muted">{d}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gold/50 bg-gold/10 p-3">
            <input type="checkbox" name="ordersPaused" defaultChecked={s.ordersPaused} className="chk mt-0.5" />
            <span><span className="block text-sm font-semibold">Pausar recebimento de pedidos</span><span className="block text-xs text-muted">Os clientes continuam vendo o cardápio, mas não conseguem finalizar pedidos (o servidor também bloqueia).</span></span>
          </label>
          <Field name="pausedMessage" label="Mensagem enquanto estiver pausado (opcional)"><input id="pausedMessage" name="pausedMessage" defaultValue={s.pausedMessage ?? ""} className="field" maxLength={200} placeholder="Ex.: Voltamos às 18h!" /></Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface2 p-3"><input type="checkbox" name="deliveryEnabled" defaultChecked={s.deliveryEnabled} className="chk" /> <span className="text-sm font-semibold">Aceitar pedidos para entrega</span></label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface2 p-3"><input type="checkbox" name="pickupEnabled" defaultChecked={s.pickupEnabled} className="chk" /> <span className="text-sm font-semibold">Aceitar retirada no local</span></label>
          </div>
        </ActionForm>
      </Section>

      <Section id="horarios" title="Horário de funcionamento" desc="Desmarque os dias em que não abre. Se nenhum horário estiver ligado, o cardápio não afirma “aberto” nem “fechado” — mostra “Confira o horário pelo WhatsApp”.">
        <ActionForm action={saveHours} submit="Salvar horários" className="space-y-3">
          {WEEKDAY_NAMES.map((n, d) => {
            const h = hourOf(d);
            return (
              <div key={d} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl border border-line bg-surface2 p-3 sm:grid-cols-[160px_1fr_1fr] sm:gap-4">
                <label className="col-span-3 flex items-center gap-2 text-sm font-semibold sm:col-span-1"><input type="checkbox" className="chk" name={`h${d}_on`} defaultChecked={h?.enabled ?? false} /> {n}</label>
                <div className="col-span-3 grid grid-cols-2 gap-2 sm:col-span-2">
                  <div><label htmlFor={`o${d}`} className="lbl">Abre</label><input id={`o${d}`} type="time" name={`h${d}_open`} defaultValue={h?.opensAt ?? "18:00"} className="field" /></div>
                  <div><label htmlFor={`c${d}`} className="lbl">Fecha</label><input id={`c${d}`} type="time" name={`h${d}_close`} defaultValue={h?.closesAt ?? "23:00"} className="field" /></div>
                </div>
                <HourError name={`h${d}`} />
              </div>
            );
          })}
          <p className="hint">Se o horário de fechamento for menor que o de abertura (ex.: 18:00 → 01:00), entende-se que fecha após a meia-noite.</p>
        </ActionForm>
      </Section>

      <Section id="entrega" title="Taxa de entrega por bairro" desc="Cadastre os bairros atendidos e a taxa de cada um. Bairro que não estiver na lista mostra “taxa a confirmar” ao cliente — o sistema nunca inventa valores. Use 0,00 para entrega grátis.">
        <ActionForm action={saveZones} submit="Salvar taxas">
          <RowsEditor name="rows" initial={zoneRows} blank={{ id: null, name: "", fee: "", active: true }} addLabel="Adicionar bairro" emptyText="Nenhum bairro cadastrado: todas as entregas mostram “taxa a confirmar”."
            columns={[{ key: "name", label: "Bairro / região", kind: "text", wide: true, maxLength: 80 }, { key: "fee", label: "Taxa (R$)", kind: "money", placeholder: "8,00" }, { key: "active", label: "Ativo", kind: "bool" }]} />
        </ActionForm>
      </Section>

      <Section id="pagamento" title="Formas de pagamento" desc="O cliente escolhe uma destas no pedido (o pagamento é combinado com o restaurante — v1 não cobra online). Mercado Pago/Pix/cartão online ficam para uma próxima etapa.">
        <ActionForm action={savePayments} submit="Salvar pagamentos">
          <RowsEditor name="rows" initial={payRows} blank={{ id: null, label: "", instructions: "", enabled: true }} addLabel="Adicionar forma de pagamento" emptyText="Nenhuma forma cadastrada: o pedido usa “Combinar com o restaurante”."
            columns={[{ key: "label", label: "Nome", kind: "text", placeholder: "Ex.: Pix na entrega", maxLength: 60 }, { key: "instructions", label: "Instruções (opcional)", kind: "text", wide: true, maxLength: 300 }, { key: "enabled", label: "Ativa", kind: "bool" }]} />
        </ActionForm>
      </Section>
    </div>
  );
}

