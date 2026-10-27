"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BellOff, X } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { orderCode } from "@/lib/whatsapp";

type Summary = { latest: { id: number; number: number; customerName: string; totalCents: number } | null; awaiting: number; received: number };

/** Avisa (faixa + som opcional + título da aba) quando chega um pedido novo com o painel aberto. */
export function NewOrderAlert({ className = "" }: { className?: string }) {
  const router = useRouter();
  const path = usePathname();
  const baseline = useRef<number | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const [sound, setSound] = useState(false);
  const [alert, setAlert] = useState<Summary["latest"]>(null);
  const [unseen, setUnseen] = useState(0);

  useEffect(() => { try { setSound(localStorage.getItem("sk_sound") === "1"); } catch { /* sem armazenamento */ } }, []);

  const beep = useCallback(() => {
    try {
      const c = ctx.current; if (!c) return;
      [880, 1175].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(c.destination);
        const t = c.currentTime + i * 0.22;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.start(t); o.stop(t + 0.22);
      });
    } catch { /* som é opcional */ }
  }, []);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    try { localStorage.setItem("sk_sound", next ? "1" : "0"); } catch { /* ok */ }
    if (next) { try { ctx.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); void ctx.current.resume(); beep(); } catch { /* sem áudio */ } }
  };

  useEffect(() => {
    if (sound && !ctx.current) { try { ctx.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { /* sem áudio */ } }
  }, [sound]);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/admin/orders/summary", { cache: "no-store" });
        if (!res.ok) return;
        const s: Summary = await res.json();
        const id = s.latest?.id ?? 0;
        if (baseline.current === null) { baseline.current = id; return; }
        if (!stop && id > baseline.current) {
          baseline.current = id; setAlert(s.latest); setUnseen((n) => n + 1);
          if (sound) { try { void ctx.current?.resume(); } catch { /* ok */ } beep(); }
          router.refresh();
        }
      } catch { /* sem rede: tenta no próximo ciclo */ }
    };
    void tick();
    const t = setInterval(tick, 20_000);
    const onVis = () => { if (document.visibilityState === "visible") void tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { stop = true; clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [beep, router, sound]);

  useEffect(() => { if (path.startsWith("/admin/pedidos")) { setAlert(null); setUnseen(0); } }, [path]);
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unseen > 0 ? `(${unseen}) ${base}` : base;
  }, [unseen]);

  return (
    <>
      <button type="button" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Desligar o som de novos pedidos" : "Ligar o som de novos pedidos"} title={sound ? "Som de novos pedidos: ligado" : "Som de novos pedidos: desligado"}
        className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-surface transition hover:bg-surface2 ${sound ? "text-ok" : "text-muted"} ${className}`}>
        {sound ? <Bell size={18} /> : <BellOff size={18} />}
      </button>
      {alert && (
        <div role="alert" className="anim-sheet fixed inset-x-3 top-3 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-shu/50 bg-surface p-3 shadow-xl">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-shu text-white"><Bell size={18} aria-hidden /></span>
          <Link href={`/admin/pedidos/${alert.id}`} className="min-w-0 flex-1">
            <b className="block">Novo pedido #{orderCode(alert.number)}</b>
            <span className="block truncate text-sm text-muted">{alert.customerName} · {formatBRL(alert.totalCents)}</span>
          </Link>
          <button type="button" className="btn btn-sm" onClick={() => setAlert(null)} aria-label="Dispensar aviso"><X size={16} /></button>
        </div>
      )}
    </>
  );
}
