"use client";
import { Plus } from "lucide-react";
import type { MenuProduct } from "@/server/catalog";
import { formatBRL } from "@/lib/money";
import { ProductImage } from "./ProductImage";

export function ProductCard({ p, onOpen, onQuickAdd, paused }: { p: MenuProduct; onOpen: (p: MenuProduct) => void; onQuickAdd: (p: MenuProduct) => void; paused: boolean }) {
  const unavailable = p.soldOut;
  return (
    <article
      className={`group relative flex gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-gold/40 sm:flex-col sm:gap-0 sm:p-0 sm:overflow-hidden ${unavailable ? "opacity-70" : ""}`}
    >
      <button type="button" onClick={() => onOpen(p)} className="absolute inset-0 z-[1] rounded-2xl" aria-label={`Ver detalhes de ${p.name}`} />

      <div className="order-2 w-[124px] shrink-0 overflow-hidden rounded-xl sm:order-1 sm:w-full sm:rounded-none">
        <div className="relative">
          <ProductImage src={p.imageUrl} thumb={p.thumbUrl} alt={p.imageAlt ?? p.name} className="sm:transition sm:duration-500 sm:group-hover:scale-[1.03]" />
          {p.isNew && !unavailable && <span className="absolute left-1.5 top-1.5 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-black">Novo</span>}
          {unavailable && <span className="absolute inset-0 grid place-items-center bg-black/65 text-xs font-bold uppercase tracking-wider text-ink">Esgotado</span>}
        </div>
      </div>

      <div className="order-1 flex min-w-0 flex-1 flex-col sm:order-2 sm:p-4">
        <h3 className="text-[15.5px] font-semibold leading-snug text-ink sm:text-base">{p.name}</h3>
        {p.portion && <p className="mt-0.5 text-sm text-muted">{p.portion}</p>}
        {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <span className="text-lg font-bold tabular-nums text-gold-soft">{formatBRL(p.priceCents)}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onQuickAdd(p); }}
            disabled={unavailable || paused}
            className="relative z-[2] grid h-11 w-11 place-items-center rounded-full bg-shu text-white shadow-[0_6px_18px_-6px_rgba(211,32,45,.7)] transition hover:bg-shu-hot active:scale-95 disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted disabled:shadow-none"
            aria-label={unavailable ? `${p.name} esgotado` : `Adicionar ${p.name}`}
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </article>
  );
}
