import Link from "next/link";
import { AlertTriangle, Camera, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, Circle, ImageOff, PauseCircle, PlayCircle, Settings, UtensilsCrossed } from "lucide-react";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { StatusChip } from "@/components/admin/StatusChip";
import { formatBRL } from "@/lib/money";
import { formatDateTime, startOfToday } from "@/lib/time";
import { orderCode } from "@/lib/whatsapp";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth/session";
import { getPublicSettings, getSettings } from "@/server/settings";
import { setOrdersPaused, setStatusMode } from "./configuracoes/actions";

export const dynamic = "force-dynamic";

function Stat({ label, value, href, tone }: { label: string; value: number | string; href?: string; tone?: "warn" }) {
  const body = (
    <div className={`card h-full transition ${href ? "hover:border-gold/60" : ""} ${tone === "warn" && Number(value) > 0 ? "border-gold/60" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function Dashboard() {
  const admin = await requireAdmin();
  const s = await getSettings();
  const since = startOfToday(s.timezone);
  const [pub, awaiting, received, today, activeProducts, soldOut, noPhoto, cats, recent, hoursOn, zones, pending] = await Promise.all([
    getPublicSettings(),
    db.order.count({ where: { status: "AWAITING_WHATSAPP" } }),
    db.order.count({ where: { status: "RECEIVED" } }),
    db.order.count({ where: { createdAt: { gte: since } } }),
    db.product.count({ where: { active: true } }),
    db.product.count({ where: { soldOut: true, active: true } }),
    db.product.count({ where: { active: true, images: { none: {} } } }),
    db.category.count({ where: { active: true } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.openingHour.count({ where: { enabled: true } }),
    db.deliveryZone.count({ where: { active: true } }),
    db.catalogPending.count({ where: { resolved: false } }),
  ]);

  const checklist = [
    { done: hoursOn > 0, label: "Cadastrar os horários de funcionamento", href: "/admin/configuracoes#horarios", why: "Sem horários, o cardápio mostra “Confira o horário pelo WhatsApp”." },
    { done: zones > 0, label: "Cadastrar bairros e taxas de entrega", href: "/admin/configuracoes#entrega", why: "Sem bairros, toda entrega aparece como “taxa a confirmar”." },
    { done: noPhoto === 0, label: `Enviar fotos dos produtos (${noPhoto} sem foto)`, href: "/admin/fotos", why: "Produtos sem foto mostram um espaço elegante com a marca." },
    { done: pending === 0, label: `Confirmar pendências do cardápio (${pending})`, href: "/admin/pendencias", why: "Itens do material original que não foram publicados por falta de confirmação." },
  ];

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={30} />
      <header>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="mt-1 text-sm text-muted">Olá, {admin.name.split(" ")[0]}. Resumo do restaurante.</p>
      </header>

      <section className={`card flex flex-wrap items-center gap-4 ${s.ordersPaused ? "border-gold/60" : ""}`} aria-label="Recebimento de pedidos">
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
          <p className="font-semibold">{s.ordersPaused ? "Pedidos PAUSADOS" : "Recebendo pedidos"}</p>
          <p className="text-sm text-muted">
            Cardápio mostrando: <strong className="text-ink">{pub.status.label}</strong>{pub.status.detail ? ` (${pub.status.detail})` : ""}.
            {s.ordersPaused ? " Os clientes veem o cardápio, mas não conseguem finalizar." : ""}
          </p>
        </div>
        <form action={setOrdersPaused.bind(null, !s.ordersPaused)} className="w-full sm:w-auto">
          <button className={`btn w-full sm:w-auto ${s.ordersPaused ? "btn-primary" : ""}`}>{s.ordersPaused ? <><PlayCircle size={18} /> Retomar pedidos</> : <><PauseCircle size={18} /> Pausar recebimento de pedidos</>}</button>
        </form>
        <div className="flex w-full flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-sm text-muted">Status do cardápio:</span>
          {(["AUTO", "OPEN", "CLOSED"] as const).map((m) => (
            <form key={m} action={setStatusMode.bind(null, m)}>
              <button className={`btn btn-sm ${s.statusMode === m ? "border-gold text-gold-soft" : ""}`} aria-pressed={s.statusMode === m}>{m === "AUTO" ? "Automático" : m === "OPEN" ? "Aberto" : "Fechado"}</button>
            </form>
          ))}
        </div>
      </section>

      <section aria-label="Atalhos" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { href: "/admin/produtos", icon: UtensilsCrossed, t: "Esgotar ou ocultar", d: "Ligar e desligar produtos na hora" },
          { href: "/admin/produtos", icon: CircleDollarSign, t: "Mudar preço ou nome", d: "Edite direto na lista" },
          { href: "/admin/fotos", icon: Camera, t: "Enviar fotos", d: "Várias de uma vez ou uma a uma" },
          { href: "/admin/pedidos", icon: ClipboardList, t: "Ver pedidos", d: "Status e histórico" },
        ].map((a) => (
          <Link key={a.t} href={a.href} className="card group flex flex-col gap-1.5 transition hover:border-ink/40">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-shu/10 text-shu-hot"><a.icon size={20} aria-hidden /></span>
            <b className="mt-1 flex items-center justify-between text-[15px]">{a.t}<ChevronRight size={16} className="text-muted transition group-hover:translate-x-0.5" aria-hidden /></b>
            <span className="text-sm text-muted">{a.d}</span>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Números">
        <Stat label="Aguardando envio" value={awaiting} href="/admin/pedidos?status=AWAITING_WHATSAPP" tone="warn" />
        <Stat label="Recebidos (a preparar)" value={received} href="/admin/pedidos?status=RECEIVED" tone="warn" />
        <Stat label="Pedidos hoje" value={today} href="/admin/pedidos" />
        <Stat label="Categorias ativas" value={cats} href="/admin/categorias" />
        <Stat label="Produtos ativos" value={activeProducts} href="/admin/produtos?estado=visiveis" />
        <Stat label="Esgotados" value={soldOut} href="/admin/produtos?estado=esgotados" />
        <Stat label="Sem foto" value={noPhoto} href="/admin/fotos" />
        <Stat label="Pendências" value={pending} href="/admin/pendencias" tone="warn" />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-semibold">Para deixar tudo pronto</h2>
          <ul className="space-y-3">
            {checklist.map((c) => (
              <li key={c.label} className="flex gap-3">
                {c.done ? <CheckCircle2 className="mt-0.5 shrink-0 text-ok" size={20} aria-label="Feito" /> : <Circle className="mt-0.5 shrink-0 text-gold" size={20} aria-label="Pendente" />}
                <div>
                  <Link href={c.href} className={`text-sm font-semibold hover:underline ${c.done ? "text-muted line-through" : ""}`}>{c.label}</Link>
                  {!c.done && <p className="text-xs text-muted">{c.why}</p>}
                </div>
              </li>
            ))}
          </ul>
          {noPhoto > 0 && <p className="mt-3 flex items-center gap-2 text-xs text-muted"><ImageOff size={14} /> Sem fotos, o cardápio continua bonito: cada produto mostra um espaço reservado com a marca.</p>}
        </section>

        <section className="card">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Últimos pedidos</h2><Link href="/admin/pedidos" className="text-sm text-gold-soft hover:underline">Ver todos</Link></div>
          <ul className="divide-y divide-line">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 hover:bg-surface2">
                  <span className="font-semibold">#{orderCode(o.number)}</span>
                  <StatusChip status={o.status} />
                  <span className="ml-auto text-sm font-semibold text-gold-soft">{formatBRL(o.totalCents)}</span>
                  <span className="w-full text-xs text-muted">{o.customerName} · {formatDateTime(o.createdAt, s.timezone)}</span>
                </Link>
              </li>
            ))}
            {recent.length === 0 && <li className="py-2 text-sm text-muted">Nenhum pedido ainda.</li>}
          </ul>
        </section>
      </div>

      {(awaiting > 0 || pub.status.state === "unknown") && (
        <p className="flex gap-2 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-gold-soft"><AlertTriangle size={18} className="shrink-0" />
          {awaiting > 0 ? `${awaiting} pedido(s) aguardando envio: o cliente registrou, mas o restaurante só recebe quando a mensagem é enviada pelo WhatsApp. ` : ""}
          {pub.status.state === "unknown" ? "O horário de funcionamento ainda não foi cadastrado." : ""}
        </p>
      )}
    </div>
  );
}
