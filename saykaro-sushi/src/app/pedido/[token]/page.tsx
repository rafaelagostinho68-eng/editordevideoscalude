import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Info } from "lucide-react";
import { getOrderByToken, STATUS_LABEL, whatsappUrlFor } from "@/server/orders";
import { getSettings } from "@/server/settings";
import { orderCode } from "@/lib/whatsapp";
import { formatBRL } from "@/lib/money";
import { WhatsAppOpener } from "@/components/cart/WhatsAppOpener";
import { Logo } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seu pedido", robots: { index: false, follow: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ r?: string }> }) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();
  const settings = await getSettings();
  const url = await whatsappUrlFor(order, settings.name);
  const waiting = order.status === "AWAITING_WHATSAPP";
  const { r } = await searchParams;

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-6">
      <div className="flex justify-center py-3"><Link href="/" aria-label="Voltar ao cardápio"><Logo name={settings.name} logoUrl={settings.logoPath ? `/media/${settings.logoPath}` : null} size="sm" /></Link></div>

      <div className="mt-4 rounded-3xl border border-line bg-surface p-6 text-center">
        <CheckCircle2 className="mx-auto text-ok" size={44} />
        <h1 className="mt-3 font-display text-2xl font-extrabold">Pedido #{orderCode(order.number)} registrado</h1>
        <p className="mt-1 text-sm text-muted">Situação: <strong className="text-ink">{STATUS_LABEL[order.status]}</strong></p>
      </div>

      {waiting && (
        <div className="mt-4 flex gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold-soft">
          <Info className="mt-0.5 shrink-0" size={18} />
          <p><strong>Falta só um passo:</strong> envie a mensagem do pedido pelo WhatsApp. O restaurante só recebe o pedido quando você toca em “enviar” no WhatsApp.</p>
        </div>
      )}

      <div className="mt-5"><WhatsAppOpener url={url} token={token} auto={waiting && r !== "0"} label={waiting ? "Enviar pedido pelo WhatsApp" : "Abrir conversa no WhatsApp"} /></div>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-5" aria-labelledby="resumo">
        <h2 id="resumo" className="mb-3 font-display text-lg font-bold">Resumo</h2>
        <ul className="space-y-2">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 text-[15px]">
              <span>{i.quantity}× {i.productName}{i.portion && <span className="text-muted"> ({i.portion})</span>}
                {i.options.map((o) => <span key={o.id} className="block text-sm text-muted">+ {o.optionName}</span>)}
                {i.notes && <span className="block text-sm italic text-muted">“{i.notes}”</span>}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{formatBRL(i.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Produtos</dt><dd className="tabular-nums">{formatBRL(order.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Entrega</dt><dd>{order.fulfillment === "PICKUP" ? "Retirada" : order.deliveryFeeCents === null ? "A confirmar" : formatBRL(order.deliveryFeeCents)}</dd></div>
          <div className="flex justify-between text-lg font-bold"><dt>{order.fulfillment === "DELIVERY" && order.deliveryFeeCents === null ? "Total dos produtos" : "Total"}</dt><dd className="tabular-nums text-gold-soft">{formatBRL(order.totalCents)}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-muted">Pagamento: {order.paymentLabel}{order.fulfillment === "DELIVERY" && ` · Entrega em ${[order.street, order.streetNumber].filter(Boolean).join(", ")}${order.neighborhood ? ` — ${order.neighborhood}` : ""}`}</p>
      </section>

      <p className="mt-6 text-center"><Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-ink">Voltar ao cardápio</Link></p>
    </main>
  );
}
