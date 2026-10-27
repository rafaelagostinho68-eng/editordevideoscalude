"use client";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../cart/CartProvider";
import { Sheet } from "../ui/Sheet";
import { Stepper } from "../ui/Stepper";
import { formatBRL } from "@/lib/money";

/** Barra inferior fixa (celular) com resumo do carrinho. */
export function CartBar() {
  const { count, subtotalCents, setDrawerOpen, hydrated } = useCart();
  if (!hydrated || count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),12px)]">
      <button
        type="button" onClick={() => setDrawerOpen(true)}
        className="anim-sheet pointer-events-auto flex h-14 w-full max-w-xl items-center justify-between gap-3 rounded-full bg-shu px-5 text-white shadow-[0_14px_40px_-10px_rgba(211,32,45,.8)] ring-1 ring-white/10 transition hover:bg-shu-hot active:scale-[.99]"
        aria-label={`Ver carrinho, ${count} ${count === 1 ? "item" : "itens"}, ${formatBRL(subtotalCents)}`}
      >
        <span className="flex items-center gap-2.5 font-semibold">
          <span className="relative"><ShoppingBag size={22} /><span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-shu">{count}</span></span>
          <span>Ver carrinho</span>
        </span>
        <span className="font-bold tabular-nums">{formatBRL(subtotalCents)}</span>
      </button>
    </div>
  );
}

export function CartDrawer({ paused }: { paused: boolean }) {
  const { lines, subtotalCents, count, drawerOpen, setDrawerOpen, setQty, remove, clear } = useCart();
  const close = () => setDrawerOpen(false);
  return (
    <Sheet
      open={drawerOpen && true} onClose={close} title="Seu carrinho" side
      footer={lines.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between"><span className="text-muted">Subtotal dos produtos</span><span className="text-xl font-bold tabular-nums">{formatBRL(subtotalCents)}</span></div>
          <p className="text-xs text-muted">Taxa de entrega e total final são confirmados no próximo passo.</p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            {paused ? (
              <p className="rounded-xl bg-surface2 px-4 py-3 text-center text-sm text-muted sm:flex-1">Pedidos pausados no momento.</p>
            ) : (
              <Link href="/checkout" onClick={close} className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-shu font-semibold text-white transition hover:bg-shu-hot sm:w-auto sm:flex-1">
                Finalizar pedido <ArrowRight size={18} />
              </Link>
            )}
            <button type="button" onClick={close} className="h-12 w-full shrink-0 rounded-full border border-line font-semibold transition hover:bg-surface2 sm:w-auto sm:flex-1">Continuar comprando</button>
          </div>
        </div>
      )}
    >
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between pr-12">
          <h2 className="font-display text-2xl font-bold">Seu carrinho</h2>
          {lines.length > 0 && <button type="button" onClick={clear} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">Limpar</button>}
        </div>
        {lines.length === 0 ? (
          <div className="grid place-items-center gap-3 py-16 text-center text-muted">
            <ShoppingBag size={40} className="text-line" />
            <p>Seu carrinho está vazio.</p>
            <button type="button" onClick={close} className="rounded-full bg-surface2 px-5 py-3 text-ink">Ver cardápio</button>
          </div>
        ) : (
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.key} className="rounded-2xl border border-line bg-surface2 p-3">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{l.name}</p>
                    {l.portion && <p className="text-sm text-muted">{l.portion}</p>}
                    {l.options.map((o) => (
                      <p key={`${o.groupId}-${o.optionId}`} className="text-sm text-muted">+ {o.optionName}{o.priceCents > 0 && ` (${formatBRL(o.priceCents)})`}</p>
                    ))}
                    {l.notes && <p className="mt-1 text-sm italic text-muted">“{l.notes}”</p>}
                  </div>
                  <p className="shrink-0 font-bold tabular-nums text-gold-soft">{formatBRL((l.unitPriceCents + l.optionsCents) * l.quantity)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Stepper size="sm" value={l.quantity} onChange={(q) => (q <= 0 ? remove(l.key) : setQty(l.key, q))} allowRemove />
                  {l.quantity > 1 && <span className="text-xs text-muted">{formatBRL(l.unitPriceCents + l.optionsCents)} cada</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <span className="sr-only" aria-live="polite">{count} itens no carrinho</span>
      </div>
    </Sheet>
  );
}
