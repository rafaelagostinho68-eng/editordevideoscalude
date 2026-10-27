"use client";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { MenuProduct } from "@/server/catalog";
import { formatBRL } from "@/lib/money";
import { Sheet } from "../ui/Sheet";
import { Stepper } from "../ui/Stepper";
import { ProductImage } from "./ProductImage";
import { useCart, type NewCartLine } from "../cart/CartProvider";

export function ProductModal({ product, onClose, paused, onAdded }: { product: MenuProduct | null; onClose: () => void; paused: boolean; onAdded: (name: string) => void }) {
  // key força reinício do estado a cada produto aberto
  return <Sheet open={!!product} onClose={onClose} title={product?.name ?? "Produto"} footer={undefined}>{product && <Inner key={product.id} product={product} onClose={onClose} paused={paused} onAdded={onAdded} />}</Sheet>;
}

function Inner({ product, onClose, paused, onAdded }: { product: MenuProduct; onClose: () => void; paused: boolean; onAdded: (n: string) => void }) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [sel, setSel] = useState<Record<number, number[]>>({});

  const toggle = (gId: number, oId: number, max: number) =>
    setSel((s) => {
      const cur = s[gId] ?? [];
      if (cur.includes(oId)) return { ...s, [gId]: cur.filter((x) => x !== oId) };
      if (max === 1) return { ...s, [gId]: [oId] };
      if (cur.length >= max) return s;
      return { ...s, [gId]: [...cur, oId] };
    });

  const { extra, problems, options } = useMemo(() => {
    let extra = 0;
    const problems: string[] = [];
    const options: NewCartLine["options"] = [];
    for (const g of product.groups) {
      const chosen = sel[g.id] ?? [];
      const min = Math.max(g.minSelect, g.required ? 1 : 0);
      if (chosen.length < min) problems.push(min === 1 ? `Escolha uma opção em "${g.name}"` : `Escolha ao menos ${min} em "${g.name}"`);
      for (const id of chosen) {
        const o = g.options.find((x) => x.id === id)!;
        extra += o.priceCents;
        options.push({ groupId: g.id, optionId: o.id, groupName: g.name, optionName: o.name, priceCents: o.priceCents });
      }
    }
    return { extra, problems, options };
  }, [sel, product.groups]);

  const unavailable = product.soldOut || paused;
  const total = (product.priceCents + extra) * qty;

  const add = () => {
    if (problems.length || unavailable) return;
    cart.add({ productId: product.id, name: product.name, portion: product.portion, unitPriceCents: product.priceCents, optionsCents: extra, quantity: qty, notes: notes.trim(), options, thumbUrl: product.thumbUrl });
    onAdded(product.name);
    onClose();
  };

  return (
    <div className="flex flex-col">
      <div className="relative">
        <ProductImage src={product.imageUrl} thumb={product.thumbUrl} alt={product.imageAlt ?? product.name} large priority className="max-h-[300px]" />
        {product.isNew && <span className="absolute left-3 top-3 rounded-md bg-shu px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">Novo</span>}
      </div>
      <div className="space-y-5 p-5 pb-6">
        <div>
          <h2 className="font-display text-2xl font-bold leading-tight text-ink">{product.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {product.portion && <span className="rounded-full border border-line bg-surface2 px-3 py-1 text-sm text-ink">{product.portion}</span>}
            <span className="text-xl font-bold tabular-nums text-ink">{formatBRL(product.priceCents)}</span>
          </div>
          {product.description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{product.description}</p>}
        </div>

        {product.groups.map((g) => {
          const single = g.maxSelect === 1;
          const chosen = sel[g.id] ?? [];
          return (
            <fieldset key={g.id} className="rounded-2xl border border-line p-4">
              <legend className="px-1 text-base font-semibold">
                {g.name}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${g.required ? "bg-shu/20 text-bad" : "bg-surface2 text-muted"}`}>
                  {g.required ? "Obrigatório" : single ? "Opcional" : `Até ${g.maxSelect}`}
                </span>
              </legend>
              {g.description && <p className="mb-2 text-sm text-muted">{g.description}</p>}
              <div className="mt-1 space-y-2">
                {g.options.map((o) => {
                  const on = chosen.includes(o.id);
                  return (
                    <button
                      key={o.id} type="button" role={single ? "radio" : "checkbox"} aria-checked={on}
                      onClick={() => toggle(g.id, o.id, g.maxSelect)}
                      className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-2 text-left transition ${on ? "border-shu bg-shu/5" : "border-line bg-surface2 hover:border-muted"}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`grid h-6 w-6 place-items-center ${single ? "rounded-full" : "rounded-md"} border ${on ? "border-shu bg-shu text-white" : "border-muted"}`}>{on && <Check size={15} strokeWidth={3} />}</span>
                        <span className="text-[15px]">{o.name}</span>
                      </span>
                      {o.priceCents > 0 && <span className="text-sm font-semibold text-ink">+ {formatBRL(o.priceCents)}</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <div>
          <label htmlFor="obs" className="mb-1.5 block text-sm font-semibold">Observações <span className="font-normal text-muted">(opcional)</span></label>
          <textarea id="obs" className="field" maxLength={200} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: sem cebola, molho à parte…" />
          <div className="mt-1 text-right text-xs text-muted">{notes.length}/200</div>
        </div>

        {problems.length > 0 && <p className="rounded-xl bg-shu/10 px-4 py-3 text-sm text-bad" role="alert">{problems[0]}</p>}
        {product.soldOut && <p className="rounded-xl bg-surface2 px-4 py-3 text-sm text-muted">Este produto está esgotado no momento.</p>}
        {paused && !product.soldOut && <p className="rounded-xl bg-surface2 px-4 py-3 text-sm text-muted">Os pedidos estão pausados no momento.</p>}
      </div>

      <div className="sticky bottom-0 safe-bottom flex items-center gap-3 border-t border-line bg-surface/95 p-4 backdrop-blur">
        <Stepper value={qty} onChange={setQty} />
        <button
          type="button" onClick={add} disabled={unavailable || problems.length > 0}
          className="flex h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-full bg-shu px-5 font-semibold text-white transition hover:bg-shu-hot active:scale-[.99] disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted"
        >
          <span>Adicionar</span>
          <span className="tabular-nums">{formatBRL(total)}</span>
        </button>
      </div>
    </div>
  );
}
