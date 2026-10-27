import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { StatusChip } from "@/components/admin/StatusChip";
import { formatBRL } from "@/lib/money";
import { formatBRPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/time";
import { orderCode } from "@/lib/whatsapp";
import { db } from "@/server/db";
import { ALL_STATUSES, STATUS_LABEL } from "@/server/orders";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";
const PAGE = 30;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = ALL_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, Number(sp.page) || 1);
  const num = Number(q.replace(/^#?sk0*/i, ""));

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ customerName: { contains: q, mode: "insensitive" } }, { customerPhone: { contains: q.replace(/\D/g, "") || "§" } }, ...(Number.isInteger(num) && num > 0 ? [{ number: num }] : [])] } : {}),
  };
  const [s, orders, total, grouped] = await Promise.all([
    getSettings(),
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { items: { select: { productName: true, quantity: true } } } }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count])) as Partial<Record<OrderStatus, number>>;
  const all = grouped.reduce((n, g) => n + g._count, 0);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ status: status, q: q || undefined, ...o })) if (v) p.set(k, v);
    const qs = p.toString();
    return `/admin/pedidos${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <AutoRefresh seconds={30} />
      <header>
        <h1 className="font-display text-2xl font-bold">Pedidos</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          “Aguardando envio” = o cliente registrou o pedido no site, mas o restaurante só recebe quando ele toca em <strong>enviar</strong> no WhatsApp. Confirme o recebimento marcando como “Recebido”. A lista atualiza sozinha a cada 30 s.
        </p>
      </header>

      <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por situação">
        <Link href={link({ status: undefined, page: undefined })} className={`chip shrink-0 ${!status ? "chip-warn" : ""}`}>Todos · {all}</Link>
        {ALL_STATUSES.map((st) => (
          <Link key={st} href={link({ status: st, page: undefined })} className={`chip shrink-0 ${status === st ? "chip-warn" : ""}`}>{STATUS_LABEL[st]} · {counts[st] ?? 0}</Link>
        ))}
      </nav>

      <form className="card flex gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="q" className="sr-only">Buscar pedido</label>
        <input id="q" name="q" defaultValue={q} className="field" placeholder="Nº do pedido, nome ou telefone" />
        <button className="btn"><Search size={18} /> Buscar</button>
      </form>

      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/pedidos/${o.id}`} className="card block transition hover:border-gold/60">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg font-bold">#{orderCode(o.number)}</span>
                <StatusChip status={o.status} />
                <span className="chip">{o.fulfillment === "DELIVERY" ? "Entrega" : "Retirada"}</span>
                {o.status === "AWAITING_WHATSAPP" && <span className="chip">{o.whatsappOpenedAt ? "WhatsApp aberto pelo cliente" : "WhatsApp ainda não aberto"}</span>}
                <span className="ml-auto text-sm text-muted">{formatDateTime(o.createdAt, s.timezone)}</span>
              </div>
              <p className="mt-1.5 text-sm"><strong>{o.customerName}</strong> · {formatBRPhone(o.customerPhone)}{o.neighborhood ? ` · ${o.neighborhood}` : ""}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}</p>
              <p className="mt-2 text-sm">
                <span className="text-muted">Produtos {formatBRL(o.subtotalCents)} · Entrega {o.fulfillment === "PICKUP" ? "—" : o.deliveryFeeCents === null ? "a confirmar" : formatBRL(o.deliveryFeeCents)} · </span>
                <strong className="text-gold-soft">Total {formatBRL(o.totalCents)}{o.deliveryFeeCents === null && o.fulfillment === "DELIVERY" ? " + entrega" : ""}</strong>
              </p>
            </Link>
          </li>
        ))}
        {orders.length === 0 && <li className="card text-sm text-muted">Nenhum pedido {status || q ? "com esses filtros" : "ainda"}.</li>}
      </ul>

      {pages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Paginação">
          <Link aria-disabled={page <= 1} href={link({ page: String(page - 1) })} className={`btn btn-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}>← Anterior</Link>
          <span className="text-sm text-muted">Página {page} de {pages}</span>
          <Link aria-disabled={page >= pages} href={link({ page: String(page + 1) })} className={`btn btn-sm ${page >= pages ? "pointer-events-none opacity-50" : ""}`}>Próxima →</Link>
        </nav>
      )}
    </div>
  );
}
