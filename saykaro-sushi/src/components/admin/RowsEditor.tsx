"use client";
import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export type Col = { key: string; label: string; kind: "text" | "money" | "bool"; placeholder?: string; maxLength?: number; wide?: boolean };
export type Row = { id: number | null } & Record<string, string | boolean | number | null>;

/**
 * Lista editável (linhas com campos). O conjunto de linhas é enviado ao servidor como JSON em um campo oculto
 * — o servidor revalida tudo. `id` identifica linhas existentes (as ausentes no envio são removidas).
 */
export function RowsEditor({ name, columns, initial, blank, addLabel = "Adicionar", emptyText = "Nenhum item." }: {
  name: string; columns: Col[]; initial: Row[]; blank: Row; addLabel?: string; emptyText?: string;
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const uid = useId();
  const set = (i: number, key: string, v: string | boolean) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: v } : r)));

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.length === 0 && <p className="mb-3 text-sm text-muted">{emptyText}</p>}
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="rounded-xl border border-line bg-surface2 p-3">
            <div className="grid gap-3 sm:grid-cols-6">
              {columns.map((c) => {
                const fid = `${uid}-${i}-${c.key}`;
                const span = c.kind === "bool" ? "sm:col-span-1" : c.wide ? "sm:col-span-3" : "sm:col-span-2";
                return (
                  <div key={c.key} className={span}>
                    {c.kind === "bool" ? (
                      <label htmlFor={fid} className="flex min-h-[48px] items-center gap-2 text-sm font-semibold">
                        <input id={fid} type="checkbox" className="chk" checked={Boolean(r[c.key])} onChange={(e) => set(i, c.key, e.target.checked)} /> {c.label}
                      </label>
                    ) : (
                      <>
                        <label htmlFor={fid} className="lbl">{c.label}</label>
                        <input id={fid} className="field" value={String(r[c.key] ?? "")} placeholder={c.placeholder} maxLength={c.maxLength ?? 120}
                          inputMode={c.kind === "money" ? "decimal" : undefined} onChange={(e) => set(i, c.key, e.target.value)} />
                      </>
                    )}
                  </div>
                );
              })}
              <div className="flex items-end sm:col-span-1">
                <button type="button" className="btn btn-sm btn-danger w-full" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="Remover linha"><Trash2 size={16} /> Remover</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-sm mt-3" onClick={() => setRows((rs) => [...rs, { ...blank }])}><Plus size={16} /> {addLabel}</button>
    </div>
  );
}
