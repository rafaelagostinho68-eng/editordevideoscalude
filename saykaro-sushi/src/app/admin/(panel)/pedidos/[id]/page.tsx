import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { StatusChip } from "@/components/admin/StatusChip";
import { formatBRL } from "@/lib/money";
import { formatBRPhone, toWhatsAppNumber } from "@/lib/phone";
import { formatDateTime } from "@/lib/time";
import { orderCode } from "@/lib/whatsapp";
import { db } from "@/server/db";
import { ALL_STATUSES, STATUS_LABEL } from "@/server/orders";
import { getSettings } from "@/server/settings";
import { changeOrderStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [s, o] = await Promise.all([
    getSettings(),
    db.order.findUnique({ where: { id }, include: { items: { include: { options: true }, orderBy: { id: "asc" } }, events: { orderBy: { createdAt: "asc" }, include: { admin: { select: { name: true } } } } } }),
  ]);
  if (!o) notFound();
  const addr = [o.street && `${o.street}, ${o.streetNumber ?? "s/n"}`, o.complement, o.neighborhood, o.reference && `Ref.: ${o.reference}`].filter(Boolean).join(" — ");
  const chat = `https://wa.me/${toWhatsAppNumber(o.customerPhone)}?text=${encodeURIComponent(`Olá, ${o.customerName.split(" ")[0]}! Aqui é do ${s.name}, sobre o seu pedido #${orderCode(o.number)}.`)}`;
  const feeTbd = o.fulfillment === "DELIVERY" && o.deliveryFeeCents === null;

  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/pedidos" className="text-sm text-muted hover:text-ink">← Pedidos</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold">Pedido #{orderCode(o.number)}</h1>
          <StatusChip status={o.status} />
        </div>
        <p className="mt-1 text-sm text-muted">Registrado em {formatDateTime(o.createdAt, s.timezone)}</p>
      </header>

      {o.status === "AWAITING_WHATSAPP" && (
        <p className="rounded-xl border border-gold/50 bg-gold/10 px-3 py-2.5 text-sm text-gold-soft" role="note">
          O cliente registrou o pedido, {o.whatsappOpenedAt ? `abriu o WhatsApp às ${formatDateTime(o.whatsappOpenedAt, s.timezone)}` : "mas ainda não abriu o WhatsApp"}. O restaurante só recebe quando a mensagem é enviada — confira no WhatsApp ({formatBRPhone(o.whatsappTarget)}) e então marque como “Recebido”.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
        <section className="card">
          <h2 className="mb-3 font-semibold">Itens</h2>
          <ul className="divide-y divide-line">
            {o.items.map((i) => (
              <li key={i.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex justify-between gap-3">
                  <span><strong>{i.quantity}×</strong> {i.productName}{i.portion ? <span className="text-muted"> ({i.portion})</span> : null}</span>
                  <span className="shrink-0 font-semibold">{formatBRL(i.lineTotalCents)}</span>
                </div>
                {i.options.length > 0 && <p className="text-sm text-muted">{i.options.map((x) => `${x.groupName}: ${x.optionName}${x.priceCents ? ` (+${formatBRL(x.priceCents)})` : ""}`).join(" · ")}</p>}
                {i.notes && <p className="text-sm italic text-muted">Obs.: {i.notes}</p>}
                <p className="text-xs text-muted">{formatBRL(i.unitPriceCents + i.optionsCents)} cada</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Produtos</dt><dd>{formatBRL(o.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd>{o.fulfillment === "PICKUP" ? "Retirada (sem taxa)" : o.deliveryFeeCents === null ? "A confirmar" : formatBRL(o.deliveryFeeCents)}</dd></div>
            <div className="flex justify-between text-base font-bold"><dt>{feeTbd ? "Total dos produtos" : "Total"}</dt><dd className="text-gold-soft">{formatBRL(o.totalCents)}</dd></div>
          </dl>
          {o.notes && <p className="mt-3 rounded-xl bg-surface2 p-3 text-sm"><strong>Observações do pedido:</strong> {o.notes}</p>}
        </section>

        <div className="space-y-5">
          <section className="card text-sm">
            <h2 className="mb-2 font-semibold">Cliente</h2>
            <p><strong>{o.customerName}</strong></p>
            <p className="text-muted">{formatBRPhone(o.customerPhone)}</p>
            <a href={chat} target="_blank" rel="noopener noreferrer" className="btn btn-sm mt-2"><MessageCircle size={16} /> Conversar no WhatsApp</a>
            <h3 className="mb-1 mt-4 font-semibold">{o.fulfillment === "DELIVERY" ? "Entrega" : "Retirada no local"}</h3>
            {o.fulfillment === "DELIVERY" ? <p className="text-muted">{addr || "—"}</p> : <p className="text-muted">O cliente vai buscar.</p>}
            <h3 className="mb-1 mt-4 font-semibold">Pagamento</h3>
            <p className="text-muted">{o.paymentLabel}</p>
          </section>

          <section className="card">
            <h2 className="mb-3 font-semibold">Situação do pedido</h2>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.filter((st) => st !== o.status).map((st) =>
                st === "CANCELLED" ? (
                  <form key={st} action={changeOrderStatus.bind(null, o.id, st)}><ConfirmButton message="Cancelar este pedido?" className="btn btn-sm btn-danger">Cancelar pedido</ConfirmButton></form>
                ) : (
                  <form key={st} action={changeOrderStatus.bind(null, o.id, st)}><button className="btn btn-sm">{STATUS_LABEL[st]}</button></form>
                ),
              )}
            </div>
          </section>

          <section className="card">
            <h2 className="mb-3 font-semibold">Histórico</h2>
            <ol className="space-y-2 text-sm">
              {o.events.map((e) => (
                <li key={e.id} className="flex justify-between gap-3">
                  <span>{STATUS_LABEL[e.status]}{e.admin ? <span className="text-muted"> · {e.admin.name}</span> : null}</span>
                  <span className="shrink-0 text-muted">{formatDateTime(e.createdAt, s.timezone)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
