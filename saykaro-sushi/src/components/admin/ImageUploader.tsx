"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { ProductImage } from "@/components/menu/ProductImage";

/**
 * Envio/substituição/remoção de imagem (foto de produto ou logo).
 * O servidor valida o conteúdo real do arquivo, redimensiona e converte; aqui só checamos o óbvio para dar resposta rápida.
 */
export function ImageUploader({ endpoint, imageUrl, name, variant = "product", help }: {
  endpoint: string; imageUrl: string | null; name: string; variant?: "product" | "logo"; help?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(file: File) {
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError("Use uma imagem JPG, PNG ou WebP.");
    if (file.size > 5 * 1024 * 1024) return setError("A imagem passa de 5 MB.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Falha no envio.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (!window.confirm("Remover esta imagem?")) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao remover.");
    } finally { setBusy(false); }
  }

  return (
    <div>
      {variant === "product" ? (
        <div className="max-w-sm overflow-hidden rounded-2xl border border-line"><ProductImage src={imageUrl} thumb={null} alt={name} large /></div>
      ) : (
        <div className="grid h-28 max-w-sm place-items-center rounded-2xl border border-line bg-surface2 p-3">
          {imageUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={imageUrl} alt={name} className="max-h-full max-w-full object-contain" /> : <span className="text-sm text-muted">Usando a logo tipográfica padrão</span>}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id={`up-${endpoint}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) void send(f); }} />
        <label htmlFor={`up-${endpoint}`} className={`btn btn-sm ${busy ? "pointer-events-none opacity-60" : ""}`} aria-disabled={busy}>
          {imageUrl ? <Upload size={16} /> : <ImagePlus size={16} />} {busy ? "Enviando…" : imageUrl ? "Trocar imagem" : "Enviar imagem"}
        </label>
        {imageUrl && <button type="button" onClick={remove} disabled={busy} className="btn btn-sm btn-danger"><Trash2 size={16} /> Remover</button>}
      </div>
      <p className="hint">{help ?? "JPG, PNG ou WebP, até 5 MB. A foto é recortada em proporção 4:3 e otimizada automaticamente."}</p>
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}
