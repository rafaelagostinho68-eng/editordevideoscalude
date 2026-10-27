"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Loader2, ShoppingBag, Store, Truck } from "lucide-react";
import type { PublicSettings } from "@/server/settings";
import { useCart, type CartLine } from "./CartProvider";
import { formatBRL } from "@/lib/money";
import { formatBRPhone, normalizeBRPhone } from "@/lib/phone";
import { slugify } from "@/lib/slug";
import { WhatsAppIcon } from "../brand/Icons";
import { Logo } from "../brand/Logo";

type Form = { name: string; phone: string; fulfillment: "DELIVERY" | "PICKUP"; street: string; number: string; complement: string; neighborhood: string; reference: string; notes: string; paymentId: number | null };
type Problem = { index: number; message: string };
const CUSTOMER_KEY = "sk_customer_v1";
const IDEM_KEY = "sk_idem_v1";

function uuid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); });
}

export function CheckoutClient({ settings }: { settings: PublicSettings }) {
  const router = useRouter();
  const cart = useCart();
  const [form, setForm] = useState<Form>({
    name: "", phone: "", fulfillment: settings.deliveryEnabled ? "DELIVERY" : "PICKUP", street: "", number: "", complement: "", neighborhood: "", reference: "", notes: "",
    paymentId: settings.paymentMethods.length === 1 ? settings.paymentMethods[0].id : null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problems, setProblems] = useState<Problem[]>([]);
  const [changed, setChanged] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const checked = useRef(false);

  // recupera dados do cliente (conveniência; nada sensível além de contato/endereço, só neste aparelho)
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "null");
      if (raw && typeof raw === "object") setForm((f) => ({ ...f, name: raw.name ?? "", phone: raw.phone ?? "", street: raw.street ?? "", number: raw.number ?? "", complement: raw.complement ?? "", neighborhood: raw.neighborhood ?? "", reference: raw.reference ?? "" }));
    } catch { /* ignora */ }
  }, []);

  // revalida preços/disponibilidade no servidor assim que o carrinho carrega
  const revalidate = useCallback(async (lines: CartLine[]) => {
    if (lines.length === 0) return;
    try {
      const res = await fetch("/api/cart/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, notes: l.notes || null, options: l.options.map((o) => ({ groupId: o.groupId, optionId: o.optionId })) })) }) });
      if (!res.ok) return;
      const data = await res.json();
      const probs: Problem[] = [];
      let priceChanged = false;
      const next = lines.map((l, i) => {
        const r = data.lines[i];
        if (!r?.ok) { probs.push({ index: i, message: r?.error?.message ?? "Item indisponível." }); return l; }
        const srv = r.line;
        if (srv.unitPriceCents !== l.unitPriceCents || srv.optionsCents !== l.optionsCents) priceChanged = true;
        return { ...l, name: srv.productName, portion: srv.portion, unitPriceCents: srv.unitPriceCents, optionsCents: srv.optionsCents };
      });
      setProblems(probs);
      if (priceChanged) { cart.replace(next); setChanged("Alguns preços foram atualizados desde que você adicionou os itens. Confira o resumo."); }
    } catch { /* offline: o servidor valida de qualquer forma ao enviar */ }
  }, [cart]);

  useEffect(() => {
    if (cart.hydrated && !checked.current && cart.lines.length > 0) { checked.current = true; void revalidate(cart.lines); }
  }, [cart.hydrated, cart.lines, revalidate]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k === "name" ? "customerName" : k === "phone" ? "customerPhone" : k === "number" ? "streetNumber" : k]: "" })); };

  const zone = useMemo(() => (form.fulfillment === "DELIVERY" && form.neighborhood ? settings.zones.find((z) => slugify(z.name) === slugify(form.neighborhood)) ?? null : null), [form.neighborhood, form.fulfillment, settings.zones]);
  const feeCents: number | null = form.fulfillment === "PICKUP" ? 0 : zone ? zone.feeCents : null;
  const subtotal = cart.subtotalCents;
  const total = subtotal + (feeCents ?? 0);

  const lineProblem = (i: number) => problems.find((p) => p.index === i)?.message;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    if (problems.length) { setFormError("Remova ou ajuste os itens indisponíveis antes de continuar."); return; }
    const payload = {
      customerName: form.name, customerPhone: form.phone, fulfillment: form.fulfillment,
      street: form.street || null, streetNumber: form.number || null, complement: form.complement || null, neighborhood: form.neighborhood || null, reference: form.reference || null,
      notes: form.notes || null, paymentMethodId: form.paymentId,
      lines: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, notes: l.notes || null, options: l.options.map((o) => ({ groupId: o.groupId, optionId: o.optionId })) })),
    };
    // a chave de idempotência só é reaproveitada se o conteúdo for IDÊNTICO (retry após falha de rede)
    const sig = JSON.stringify(payload);
    let key = uuid();
    try { const s = JSON.parse(sessionStorage.getItem(IDEM_KEY) ?? "null"); if (s?.sig === sig) key = s.key; else sessionStorage.setItem(IDEM_KEY, JSON.stringify({ sig, key })); } catch { /* ignora */ }

    setBusy(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, idempotencyKey: key }) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400 && data.fields) { setErrors(data.fields); setFormError("Confira os campos destacados."); return; }
      if (!res.ok) {
        setFormError(data.error ?? "Não foi possível registrar o pedido. Tente novamente.");
        if (res.status === 409) { checked.current = false; void revalidate(cart.lines); }
        return;
      }
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: form.name, phone: form.phone, street: form.street, number: form.number, complement: form.complement, neighborhood: form.neighborhood, reference: form.reference }));
        sessionStorage.removeItem(IDEM_KEY);
      } catch { /* ignora */ }
      cart.clear();
      router.push(`/pedido/${data.token}`);
    } catch {
      setFormError("Sem conexão. Verifique a internet e tente novamente — seu carrinho foi mantido.");
    } finally {
      setBusy(false);
    }
  }

  const fieldErr = (k: string) => (errors[k] ? <p id={`e-${k}`} className="mt-1 text-sm text-bad" role="alert">{errors[k]}</p> : null);
  const aria = (k: string) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `e-${k}` : undefined });

  if (!cart.hydrated) return <div className="grid min-h-dvh place-items-center"><Loader2 className="animate-spin text-muted" /></div>;

  if (cart.lines.length === 0)
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div>
          <ShoppingBag className="mx-auto mb-4 text-line" size={48} />
          <h1 className="font-display text-2xl font-bold">Seu carrinho está vazio</h1>
          <p className="mt-2 text-muted">Escolha alguns itens no cardápio para fazer seu pedido.</p>
          <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-shu px-6 font-semibold text-white">Ver cardápio</Link>
        </div>
      </main>
    );

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 pb-16 pt-4">
      <div className="flex items-center justify-between py-2">
        <Link href="/" className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-muted hover:text-ink"><ArrowLeft size={20} /> Cardápio</Link>
        <Logo name={settings.name} logoUrl={settings.logoUrl} size="sm" />
      </div>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Finalizar pedido</h1>

      {settings.ordersPaused && (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border border-shu/50 bg-shu/10 p-4 text-sm"><AlertTriangle className="mt-0.5 shrink-0 text-bad" size={18} /><p><strong>Pedidos pausados.</strong> {settings.pausedMessage || "No momento não estamos recebendo pedidos."}</p></div>
      )}
      {changed && <div role="status" className="mt-4 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold-soft">{changed}</div>}

      <form onSubmit={submit} noValidate className="mt-5 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-surface p-5" aria-labelledby="s1">
            <h2 id="s1" className="mb-4 font-display text-xl font-bold">Seus dados</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">Nome</label>
                <input id="name" className="field" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} {...aria("customerName")} />
                {fieldErr("customerName")}
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold">Telefone / WhatsApp</label>
                <input id="phone" className="field" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(21) 99999-9999" value={form.phone}
                  onChange={(e) => { const n = normalizeBRPhone(e.target.value); set("phone", n.digits.length >= 10 ? formatBRPhone(n.digits) : e.target.value); }} {...aria("customerPhone")} />
                {fieldErr("customerPhone")}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5" aria-labelledby="s2">
            <h2 id="s2" className="mb-4 font-display text-xl font-bold">Como você quer receber?</h2>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Entrega ou retirada">
              {([["DELIVERY", "Entrega", Truck, settings.deliveryEnabled], ["PICKUP", "Retirada", Store, settings.pickupEnabled]] as const).map(([v, label, Icon, enabled]) => (
                <button key={v} type="button" role="radio" aria-checked={form.fulfillment === v} disabled={!enabled} onClick={() => set("fulfillment", v)}
                  className={`flex h-14 items-center justify-center gap-2 rounded-2xl border font-semibold transition disabled:opacity-40 ${form.fulfillment === v ? "border-gold bg-gold/10 text-gold-soft" : "border-line bg-surface2"}`}>
                  <Icon size={20} /> {label}
                </button>
              ))}
            </div>

            {form.fulfillment === "DELIVERY" ? (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-[1fr_110px] gap-3">
                  <div>
                    <label htmlFor="street" className="mb-1.5 block text-sm font-semibold">Rua / Avenida</label>
                    <input id="street" className="field" autoComplete="address-line1" value={form.street} onChange={(e) => set("street", e.target.value)} maxLength={120} {...aria("street")} />
                    {fieldErr("street")}
                  </div>
                  <div>
                    <label htmlFor="num" className="mb-1.5 block text-sm font-semibold">Número</label>
                    <input id="num" className="field" inputMode="numeric" value={form.number} onChange={(e) => set("number", e.target.value)} maxLength={20} {...aria("streetNumber")} />
                    {fieldErr("streetNumber")}
                  </div>
                </div>
                <div>
                  <label htmlFor="bairro" className="mb-1.5 block text-sm font-semibold">Bairro</label>
                  {settings.zones.length > 0 ? (
                    <>
                      <select id="bairro" className="field" value={settings.zones.some((z) => z.name === form.neighborhood) ? form.neighborhood : form.neighborhood ? "__outro" : ""} onChange={(e) => set("neighborhood", e.target.value === "__outro" ? " " : e.target.value)} {...aria("neighborhood")}>
                        <option value="">Selecione…</option>
                        {settings.zones.map((z) => <option key={z.id} value={z.name}>{z.name} — {formatBRL(z.feeCents)}</option>)}
                        <option value="__outro">Outro bairro (taxa a confirmar)</option>
                      </select>
                      {!settings.zones.some((z) => z.name === form.neighborhood) && form.neighborhood !== "" && (
                        <input className="field mt-2" aria-label="Nome do bairro" placeholder="Digite o bairro" value={form.neighborhood.trim()} onChange={(e) => set("neighborhood", e.target.value || " ")} maxLength={80} />
                      )}
                    </>
                  ) : (
                    <input id="bairro" className="field" autoComplete="address-level2" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} maxLength={80} {...aria("neighborhood")} />
                  )}
                  {fieldErr("neighborhood")}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label htmlFor="comp" className="mb-1.5 block text-sm font-semibold">Complemento <span className="font-normal text-muted">(opcional)</span></label><input id="comp" className="field" value={form.complement} onChange={(e) => set("complement", e.target.value)} maxLength={60} /></div>
                  <div><label htmlFor="ref" className="mb-1.5 block text-sm font-semibold">Ponto de referência <span className="font-normal text-muted">(opcional)</span></label><input id="ref" className="field" value={form.reference} onChange={(e) => set("reference", e.target.value)} maxLength={120} /></div>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-surface2 p-4 text-sm text-muted">Você retira o pedido com o restaurante. Combine o horário e o local pelo WhatsApp.</p>
            )}
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5" aria-labelledby="s3">
            <h2 id="s3" className="mb-4 font-display text-xl font-bold">Pagamento e observações</h2>
            <div className="space-y-4">
              {settings.paymentMethods.length > 1 ? (
                <div role="radiogroup" aria-label="Forma de pagamento" className="space-y-2">
                  {settings.paymentMethods.map((m) => (
                    <button key={m.id} type="button" role="radio" aria-checked={form.paymentId === m.id} onClick={() => set("paymentId", m.id)}
                      className={`flex min-h-[52px] w-full items-center rounded-xl border px-4 text-left transition ${form.paymentId === m.id ? "border-gold bg-gold/10" : "border-line bg-surface2"}`}>{m.label}</button>
                  ))}
                  {errors.paymentMethodId && <p className="text-sm text-bad">{errors.paymentMethodId}</p>}
                </div>
              ) : (
                <p className="rounded-xl bg-surface2 px-4 py-3"><span className="text-sm text-muted">Pagamento: </span><strong>{settings.paymentMethods[0]?.label ?? "Combinar com o restaurante"}</strong></p>
              )}
              <div>
                <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold">Observações do pedido <span className="font-normal text-muted">(opcional)</span></label>
                <textarea id="notes" className="field" maxLength={300} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Ex.: sem cebola, trocar o molho…" />
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-3xl border border-line bg-surface p-5" aria-labelledby="s4">
            <h2 id="s4" className="mb-4 font-display text-xl font-bold">Resumo</h2>
            <ul className="space-y-3">
              {cart.lines.map((l, i) => (
                <li key={l.key} className={`rounded-xl p-3 ${lineProblem(i) ? "border border-shu/60 bg-shu/10" : "bg-surface2"}`}>
                  <div className="flex justify-between gap-3">
                    <p className="font-medium leading-snug">{l.quantity}× {l.name}{l.portion && <span className="text-muted"> ({l.portion})</span>}</p>
                    <p className="shrink-0 font-semibold tabular-nums">{formatBRL((l.unitPriceCents + l.optionsCents) * l.quantity)}</p>
                  </div>
                  {l.options.map((o) => <p key={`${o.groupId}-${o.optionId}`} className="text-sm text-muted">+ {o.optionName}</p>)}
                  {l.notes && <p className="text-sm italic text-muted">“{l.notes}”</p>}
                  {lineProblem(i) && (
                    <div className="mt-2 flex items-center justify-between gap-2 text-sm text-bad"><span>{lineProblem(i)}</span><button type="button" onClick={() => { cart.remove(l.key); setProblems([]); checked.current = false; }} className="shrink-0 rounded-full border border-shu/60 px-3 py-1.5 font-semibold">Remover</button></div>
                  )}
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[15px]">
              <div className="flex justify-between"><dt className="text-muted">Produtos</dt><dd className="tabular-nums">{formatBRL(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd className="text-right tabular-nums">{form.fulfillment === "PICKUP" ? "Retirada" : feeCents === null ? <span className="text-gold-soft">A confirmar pelo restaurante</span> : formatBRL(feeCents)}</dd></div>
              <div className="flex items-baseline justify-between border-t border-line pt-3 text-lg font-bold"><dt>{form.fulfillment === "DELIVERY" && feeCents === null ? "Total dos produtos" : "Total"}</dt><dd className="tabular-nums text-gold-soft">{formatBRL(total)}</dd></div>
            </dl>
            {form.fulfillment === "DELIVERY" && feeCents === null && <p className="mt-2 text-xs text-muted">A taxa de entrega será informada pelo restaurante no WhatsApp e somada ao total.</p>}

            {formError && <p role="alert" className="mt-4 rounded-xl bg-shu/10 px-4 py-3 text-sm text-bad">{formError}</p>}
            <button type="submit" disabled={busy || settings.ordersPaused}
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#15803d] text-lg font-bold text-white transition hover:brightness-110 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? <Loader2 className="animate-spin" size={22} /> : <WhatsAppIcon className="h-6 w-6" />} {busy ? "Registrando…" : "Enviar pedido pelo WhatsApp"}
            </button>
            <p className="mt-3 text-center text-xs text-muted">Nenhuma cobrança é feita agora. O pedido só é recebido pelo restaurante quando você envia a mensagem no WhatsApp.</p>
          </section>
        </aside>
      </form>
    </main>
  );
}
