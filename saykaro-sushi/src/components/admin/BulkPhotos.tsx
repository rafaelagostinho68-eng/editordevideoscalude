"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { matchProduct } from "@/lib/photo-match";

type P = { id: number; name: string; category: string; hasPhoto: boolean };
type Item = { key: string; file: File; preview: string; productId: number | null; auto: boolean; status: "idle" | "sending" | "ok" | "err"; msg?: string };

/**
 * Envia várias fotos de uma vez. O sistema tenta ligar cada arquivo a um produto pelo NOME do arquivo
 * (ex.: "hot-filadelfia.jpg"); o que não casar com certeza fica para a pessoa escolher antes de enviar.
 */
export function BulkPhotos({ products }: { products: P[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, P[]>();
    for (const p of products) m.set(p.category, [...(m.get(p.category) ?? []), p]);
    return [...m.entries()];
  }, [products]);

  const add = (files: FileList | File[]) => {
    setProblem(null);
    const list = [...files];
    const next: Item[] = []; const skipped: string[] = [];
    for (const f of list) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { skipped.push(`${f.name} (use JPG, PNG ou WebP)`); continue; }
      if (f.size > 5 * 1024 * 1024) { skipped.push(`${f.name} (passa de 5 MB)`); continue; }
      const id = matchProduct(f.name, products);
      next.push({ key: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 7)}`, file: f, preview: URL.createObjectURL(f), productId: id, auto: id !== null, status: "idle" });
    }
    if (skipped.length) setProblem(`Não foram adicionados: ${skipped.join("; ")}.`);
    setItems((cur) => [...cur, ...next]);
  };

  const set = (key: string, p: Partial<Item>) => setItems((cur) => cur.map((i) => (i.key === key ? { ...i, ...p } : i)));
  const remove = (key: string) => setItems((cur) => { const it = cur.find((i) => i.key === key); if (it) URL.revokeObjectURL(it.preview); return cur.filter((i) => i.key !== key); });

  const ready = items.filter((i) => i.productId && i.status !== "ok");
  const dup = (() => { const seen = new Map<number, number>(); for (const i of ready) seen.set(i.productId!, (seen.get(i.productId!) ?? 0) + 1); return new Set([...seen].filter(([, n]) => n > 1).map(([id]) => id)); })();

  async function sendAll() {
    setBusy(true); setProblem(null);
    const sent = new Set<number>();
    for (const it of ready) {
      if (sent.has(it.productId!)) { set(it.key, { status: "err", msg: "Outra foto já foi enviada para este produto nesta rodada." }); continue; }
      set(it.key, { status: "sending", msg: undefined });
      try {
        const fd = new FormData(); fd.append("file", it.file);
        const res = await fetch(`/api/admin/products/${it.productId}/image`, { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Falha no envio.");
        sent.add(it.productId!); set(it.key, { status: "ok", msg: "Enviada" });
      } catch (e) { set(it.key, { status: "err", msg: e instanceof Error ? e.message : "Falha no envio." }); }
    }
    setBusy(false); router.refresh();
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) add(e.dataTransfer.files); }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${drag ? "border-shu bg-shu/5" : "border-line bg-surface"}`}
      >
        <UploadCloud className="mx-auto text-muted" size={36} aria-hidden />
        <p className="mt-2 font-semibold">Arraste as fotos aqui ou escolha no aparelho</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">JPG, PNG ou WebP, até 5 MB cada. Se o arquivo tiver o nome do produto (ex.: <b>hot-filadelfia.jpg</b>), o sistema já escolhe o produto sozinho.</p>
        <input ref={input} id="bulk-files" type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
        <label htmlFor="bulk-files" className="btn btn-primary mt-4 cursor-pointer"><ImagePlus size={18} /> Escolher fotos</label>
      </div>

      {problem && <p role="alert" className="rounded-xl border border-shu/40 bg-shu/10 px-3 py-2 text-sm text-bad">{problem}</p>}

      {items.length > 0 && (
        <section aria-label="Fotos escolhidas" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{items.length} foto{items.length === 1 ? "" : "s"} · {ready.length} pronta{ready.length === 1 ? "" : "s"} para enviar</h2>
            <button type="button" className="btn btn-primary" disabled={busy || ready.length === 0 || dup.size > 0} onClick={sendAll}>
              {busy ? <><Loader2 className="animate-spin" size={18} /> Enviando…</> : <>Enviar {ready.length} foto{ready.length === 1 ? "" : "s"}</>}
            </button>
          </div>
          {dup.size > 0 && <p className="text-sm text-bad">Há mais de uma foto escolhida para o mesmo produto. Troque ou remova uma delas.</p>}
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.key} className="card !p-3">
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.preview} alt="" className="aspect-[4/3] w-24 shrink-0 rounded-xl border border-line object-cover sm:w-28" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-muted" title={it.file.name}>{it.file.name}</p>
                    <label className="sr-only" htmlFor={`sel-${it.key}`}>Produto desta foto</label>
                    <select id={`sel-${it.key}`} className="field mt-1 !min-h-11" value={it.productId ?? ""} disabled={it.status === "ok" || busy}
                      onChange={(e) => set(it.key, { productId: e.target.value ? Number(e.target.value) : null, auto: false, status: "idle", msg: undefined })}>
                      <option value="">Escolha o produto…</option>
                      {groups.map(([cat, list]) => (
                        <optgroup key={cat} label={cat}>
                          {list.map((p) => <option key={p.id} value={p.id}>{p.name}{p.hasPhoto ? " (já tem foto — será trocada)" : ""}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <p className="mt-1 flex items-center gap-1.5 text-sm" aria-live="polite">
                      {it.status === "ok" && <span className="flex items-center gap-1 font-semibold text-ok"><Check size={16} /> Enviada</span>}
                      {it.status === "sending" && <span className="flex items-center gap-1 text-muted"><Loader2 className="animate-spin" size={16} /> Enviando…</span>}
                      {it.status === "err" && <span className="flex items-center gap-1 text-bad"><AlertCircle size={16} /> {it.msg}</span>}
                      {it.status === "idle" && it.auto && it.productId && <span className="text-muted">Escolhido pelo nome do arquivo. Confira.</span>}
                      {it.status === "idle" && !it.productId && <span className="text-muted">Escolha o produto desta foto.</span>}
                    </p>
                  </div>
                  <button type="button" className="btn btn-sm h-fit" onClick={() => remove(it.key)} disabled={busy && it.status === "sending"} aria-label={`Remover ${it.file.name} da lista`}><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
