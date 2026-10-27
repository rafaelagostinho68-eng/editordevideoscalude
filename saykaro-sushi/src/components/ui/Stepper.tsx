"use client";
import { Minus, Plus, Trash2 } from "lucide-react";

export function Stepper({ value, onChange, min = 1, max = 50, allowRemove = false, size = "md" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; allowRemove?: boolean; size?: "sm" | "md";
}) {
  const h = size === "md" ? "h-11" : "h-10";
  const btn = `${size === "md" ? "h-11 w-11" : "h-10 w-10"} grid place-items-center rounded-full border border-line bg-surface2 text-ink transition active:scale-95 disabled:opacity-40`;
  return (
    <div className={`inline-flex items-center gap-1 ${h}`} role="group" aria-label="Quantidade">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={!allowRemove && value <= min} aria-label={allowRemove && value <= min ? "Remover item" : "Diminuir quantidade"}>
        {allowRemove && value <= min ? <Trash2 size={18} /> : <Minus size={18} />}
      </button>
      <span className="w-9 text-center text-base font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Aumentar quantidade">
        <Plus size={18} />
      </button>
    </div>
  );
}
