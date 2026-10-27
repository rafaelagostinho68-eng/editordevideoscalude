"use client";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Camera, Check, MoreHorizontal, Search, Star, Tag, X } from "lucide-react";
import { FoodArt } from "@/components/brand/FoodArt";
import { artKind } from "@/lib/art";
import { centsToInput, parseBRLToCents } from "@/lib/money";
import { moveProduct } from "@/app/admin/(panel)/produtos/actions";
import { quickCategoryActive, quickClearSoldOut, quickPatchProduct } from "@/app/admin/(panel)/produtos/quick-actions";

export type QRow = { id: number; categoryId: number; name: string; priceCents: number; portion: string | null; active: boolean; soldOut: boolean; featured: boolean; isNew: boolean; thumb: string | null };
export type QCat = { id: number; name: string; active: boolean };
type Filter = "all" | "soldout" | "hidden" | "nophoto";

/** Interruptor acessível (liga/desliga) com texto — grande o bastante para o dedo. */
function Switch({ on, onChange, label, onText, offText, offTone = "muted", disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; onText: string; offText: string; offTone?: "muted" | "bad"; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled}
      onClick={() => onChange(!on)}
      className={`inline-flex h-11 min-w-[8.5rem] items-center gap-2.5 rounded-full border px-3 text-sm font-semibold transition disabled:opacity-60 ${on ? "border-ok/40 bg-ok/10 text-ok" : offTone === "bad" ? "border-shu/40 bg-shu/10 text-bad" : "border-line bg-surface2 text-muted"}`}
    >
      <span aria-hidden className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-ok" : offTone === "bad" ? "bg-shu" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {on ? onText : offText}
    </button>
  );
}

export function QuickMenu({ categories, products, initialFilter }: { categories: QCat[]; products: QRow[]; initialFilter?: Filter }) {
  const [rows, setRows] = useState<QRow[]>(products);
  const [cats, setCats] = useState<QCat[]>(categories);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter ?? "all");
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const say = useCallback((text: string, bad = false) => { setNote({ text, bad }); clearTimeout(timer.current); timer.current = setTimeout(() => setNote(null), bad ? 4500 : 1800); }, []);

  const catName = useMemo(() => new Map(cats.map((c) => [c.id, c.name])), [cats]);
  const counts = useMemo(() => ({
    soldout: rows.filter((r) => r.soldOut).length,
    hidden: rows.filter((r) => !r.active).length,
    nophoto: rows.filter((r) => !r.thumb).length,
  }), [rows]);

  const patchLocal = (id: number, p: Partial<QRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  /** Aplica na tela na hora e confirma no servidor; se falhar, desfaz e avisa. */
  const patch = (id: number, p: Partial<QRow>, serverPatch: Record<string, unknown>, okText?: string) => {
    const before = rows.find((r) => r.id === id);
    if (!before) return;
    patchLocal(id, p);
    startTransition(async () => {
      const r = await quickPatchProduct(id, serverPatch).catch(() => ({ ok: false as const, error: "Sem conexão. Tente de novo." }));
      if (r.ok) { if (okText) say(okText); }
      else { patchLocal(id, Object.fromEntries(Object.keys(p).map((k) => [k, before[k as keyof QRow]])) as Partial<QRow>); say(r.error, true); }
    });
  };

  const move = (id: number, dir: "up" | "down") => {
    setRows((rs) => {
      const me = rs.find((r) => r.id === id); if (!me) return rs;
      const group = rs.filter((r) => r.categoryId === me.categoryId);
      const i = group.findIndex((r) => r.id === id), j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= group.length) return rs;
      const a = rs.indexOf(group[i]), b = rs.indexOf(group[j]);
      const next = rs.slice(); [next[a], next[b]] = [next[b], next[a]]; return next;
    });
    startTransition(async () => { await moveProduct(id, dir).catch(() => say("Não foi possível reordenar.", true)); });
  };

  const toggleCat = (c: QCat) => {
    setCats((cs) => cs.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
    startTransition(async () => {
      const r = await quickCategoryActive(c.id, !c.active).catch(() => ({ ok: false as const, error: "Sem conexão." }));
      if (!r.ok) { setCats((cs) => cs.map((x) => (x.id === c.id ? { ...x, active: c.active } : x))); say(r.error, true); } else say(!c.active ? "Categoria no cardápio." : "Categoria oculta do cardápio.");
    });
  };

  const clearSoldOut = () => {
    setRows((rs) => rs.map((r) => ({ ...r, soldOut: false })));
    startTransition(async () => { const r = await quickClearSoldOut().catch(() => null); say(r?.ok ? "Tudo disponível de novo." : "Não foi possível atualizar.", !r?.ok); });
  };

  const upload = async (id: number, file: File) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return say("Use uma imagem JPG, PNG ou WebP.", true);
    if (file.size > 5 * 1024 * 1024) return say("A imagem passa de 5 MB.", true);
    say("Enviando foto…");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`/api/admin/products/${id}/image`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha no envio.");
      patchLocal(id, { thumb: data.thumbUrl ?? data.url }); say("Foto salva.");
    } catch (e) { say(e instanceof Error ? e.message : "Falha no envio.", true); }
  };

  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const visible = rows.filter((r) =>
    (!q.trim() || norm(r.name).includes(norm(q.trim()))) &&
    (filter === "all" || (filter === "soldout" && r.soldOut) || (filter === "hidden" && !r.active) || (filter === "nophoto" && !r.thumb)));
  const FILTERS: { v: Filter; label: string; n?: number }[] = [
    { v: "all", label: "Todos", n: rows.length }, { v: "soldout", label: "Esgotados", n: counts.soldout },
    { v: "hidden", label: "Ocultos", n: counts.hidden }, { v: "nophoto", label: "Sem foto", n: counts.nophoto },
  ];

  return (
    <div>
      {/* barra de busca + filtros (fica visível ao rolar) */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="qm-q" className="sr-only">Buscar produto pelo nome</label>
            <input id="qm-q" className="field !pl-10" type="search" placeholder="Buscar produto…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {counts.soldout > 0 && <button type="button" className="btn" onClick={clearSoldOut}><Check size={16} /> Voltar tudo ao estoque ({counts.soldout})</button>}
        </div>
        <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto" role="group" aria-label="Filtrar lista">
          {FILTERS.map((f) => (
            <button key={f.v} type="button" aria-pressed={filter === f.v} onClick={() => setFilter(f.v)}
              className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${filter === f.v ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-muted"}`}>
              {f.label}{typeof f.n === "number" && f.v !== "all" ? <span className="ml-1.5 opacity-70">{f.n}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8 pt-5">
        {cats.map((c) => {
          const list = visible.filter((r) => r.categoryId === c.id);
          if (list.length === 0) return null;
          return (
            <section key={c.id} aria-labelledby={`qc-${c.id}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 id={`qc-${c.id}`} className="text-lg font-extrabold">{c.name} <span className="text-sm font-medium text-muted">· {rows.filter((r) => r.categoryId === c.id).length}</span></h2>
                <Switch on={c.active} onChange={() => toggleCat(c)} label={`Categoria ${c.name} no cardápio`} onText="Categoria visível" offText="Categoria oculta" />
              </div>
              <ul className={`space-y-3 ${c.active ? "" : "opacity-60"}`}>
                {list.map((r, idx) => (
                  <Row key={r.id} r={r} catName={catName.get(r.categoryId) ?? ""} first={idx === 0 && !q && filter === "all"} last={idx === list.length - 1 && !q && filter === "all"}
                    canMove={!q && filter === "all"} onPatch={patch} onMove={move} onUpload={upload} onError={(t) => say(t, true)} />
                ))}
              </ul>
            </section>
          );
        })}
        {visible.length === 0 && <p className="card text-sm text-muted">Nenhum produto encontrado.</p>}
      </div>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-6">
        {note && <div className={`anim-sheet rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg ${note.bad ? "bg-shu text-white" : "bg-ink text-bg"}`}>{note.text}</div>}
      </div>
    </div>
  );
}

function Row({ r, catName, first, last, canMove, onPatch, onMove, onUpload, onError }: {
  r: QRow; catName: string; first: boolean; last: boolean; canMove: boolean;
  onPatch: (id: number, p: Partial<QRow>, s: Record<string, unknown>, ok?: string) => void;
  onMove: (id: number, d: "up" | "down") => void; onUpload: (id: number, f: File) => void; onError: (t: string) => void;
}) {
  const [name, setName] = useState(r.name);
  const [price, setPrice] = useState(centsToInput(r.priceCents));
  const file = useRef<HTMLInputElement>(null);
  const fit = (el: HTMLTextAreaElement | null) => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } };

  const saveName = () => {
    const v = name.trim();
    if (v === r.name) return setName(r.name);
    if (v.length < 2) { setName(r.name); return onError("O nome precisa ter pelo menos 2 letras."); }
    onPatch(r.id, { name: v }, { name: v }, "Nome salvo.");
  };
  const savePrice = () => {
    const c = parseBRLToCents(price);
    if (c === null || c <= 0) { setPrice(centsToInput(r.priceCents)); return onError("Preço inválido. Use o formato 19,90."); }
    setPrice(centsToInput(c));
    if (c !== r.priceCents) onPatch(r.id, { priceCents: c }, { priceCents: c }, "Preço salvo.");
  };

  return (
    <li className={`card relative !p-3 sm:!p-4 ${r.soldOut ? "border-shu/40" : ""}`}>
        <details className="group absolute right-2 top-2 z-10 open:z-30">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-line bg-surface hover:bg-surface2 [&::-webkit-details-marker]:hidden" aria-label={`Mais opções de ${r.name}`}><MoreHorizontal size={18} aria-hidden /></summary>
          <div className="absolute right-0 z-10 mt-2 w-60 space-y-1 rounded-2xl border border-line bg-surface p-2 shadow-lg">
            <button type="button" className="flex h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold hover:bg-surface2" onClick={() => onPatch(r.id, { featured: !r.featured }, { featured: !r.featured }, r.featured ? "Saiu dos destaques." : "Agora é destaque.")}>
              <Star size={16} aria-hidden className={r.featured ? "fill-gold text-gold" : ""} /> {r.featured ? "Tirar dos destaques" : "Marcar como destaque"}
            </button>
            <button type="button" className="flex h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold hover:bg-surface2" onClick={() => onPatch(r.id, { isNew: !r.isNew }, { isNew: !r.isNew }, r.isNew ? "Etiqueta NOVO removida." : "Etiqueta NOVO ligada.")}>
              {r.isNew ? <X size={16} aria-hidden /> : <Tag size={16} aria-hidden />}{r.isNew ? "Tirar etiqueta NOVO" : "Pôr etiqueta NOVO"}
            </button>
            {canMove && (
              <div className="flex gap-1">
                <button type="button" disabled={first} className="btn btn-sm flex-1" onClick={() => onMove(r.id, "up")} aria-label={`Subir ${r.name}`}><ArrowUp size={16} aria-hidden /> Subir</button>
                <button type="button" disabled={last} className="btn btn-sm flex-1" onClick={() => onMove(r.id, "down")} aria-label={`Descer ${r.name}`}><ArrowDown size={16} aria-hidden /> Descer</button>
              </div>
            )}
            <Link href={`/admin/produtos/${r.id}`} className="flex h-11 w-full items-center rounded-xl px-3 text-sm font-semibold hover:bg-surface2">Editar tudo (descrição, opções, excluir)…</Link>
          </div>
        </details>
      <div className="flex gap-3">
        <div className="relative w-[84px] shrink-0 sm:w-[104px]">
          <button type="button" onClick={() => file.current?.click()} aria-label={r.thumb ? `Trocar a foto de ${r.name}` : `Enviar foto de ${r.name}`}
            className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-surface2">
            {r.thumb ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.thumb} alt="" className="h-full w-full object-cover" /> : (
              <span className="grid h-full w-full place-items-center"><FoodArt kind={artKind(catName, r.name)} className={artKind(catName, r.name) === "torii" ? "h-6 w-6" : "h-auto w-[78%]"} /></span>
            )}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-1 text-[11px] font-semibold text-white"><Camera size={12} aria-hidden /> {r.thumb ? "Trocar" : "Foto"}</span>
          </button>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(r.id, f); e.target.value = ""; }} />
        </div>

        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={`n-${r.id}`}>Nome do produto</label>
          <textarea id={`n-${r.id}`} ref={fit} rows={1} value={name} maxLength={120} onChange={(e) => { setName(e.target.value.replace(/\n/g, " ")); fit(e.target); }} onBlur={saveName}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } if (e.key === "Escape") { setName(r.name); (e.target as HTMLTextAreaElement).blur(); } }}
            className="block w-full resize-none overflow-hidden rounded-lg border border-transparent bg-transparent py-1 pl-1.5 pr-12 text-[17px] font-bold leading-tight hover:border-line focus:border-ink focus:bg-surface2 focus:outline-none" />
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <label htmlFor={`p-${r.id}`} className="text-sm font-semibold text-muted">R$</label>
              <input id={`p-${r.id}`} value={price} inputMode="decimal" aria-label={`Preço de ${r.name}`} onChange={(e) => setPrice(e.target.value)} onBlur={savePrice}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setPrice(centsToInput(r.priceCents)); (e.target as HTMLInputElement).blur(); } }}
                className="h-10 w-24 rounded-lg border border-line bg-surface2 px-2.5 text-right text-[17px] font-bold tabular-nums focus:border-ink focus:outline-none" />
            </div>
            {r.portion && <span className="text-sm text-muted">{r.portion}</span>}
            {r.featured && <span className="chip chip-ok">Destaque</span>}
            {r.isNew && <span className="chip chip-ok">Novo</span>}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Switch on={!r.soldOut} onChange={(v) => onPatch(r.id, { soldOut: !v }, { soldOut: !v }, v ? "Disponível de novo." : "Marcado como esgotado.")} label={`Disponível hoje: ${r.name}`} onText="Disponível" offText="Esgotado" offTone="bad" />
        <Switch on={r.active} onChange={(v) => onPatch(r.id, { active: v }, { active: v }, v ? "Voltou ao cardápio." : "Oculto do cardápio.")} label={`No cardápio: ${r.name}`} onText="No cardápio" offText="Oculto" />
      </div>
    </li>
  );
}
