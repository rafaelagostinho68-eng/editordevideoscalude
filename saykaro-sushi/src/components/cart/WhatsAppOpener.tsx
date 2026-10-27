"use client";
import { useEffect, useState } from "react";
import { WhatsAppIcon } from "../brand/Icons";

/** Botão principal do pedido + tentativa única de abrir o WhatsApp automaticamente (sem criar novo pedido). */
export function WhatsAppOpener({ url, token, auto, label }: { url: string; token: string; auto: boolean; label: string }) {
  const [opening, setOpening] = useState(false);
  const mark = () => { void fetch(`/api/orders/${token}/opened`, { method: "POST", keepalive: true }).catch(() => {}); };

  useEffect(() => {
    if (!auto) return;
    const k = `sk_wa_auto_${token}`;
    try { if (sessionStorage.getItem(k)) return; } catch { /* segue */ }
    setOpening(true);
    // O "já abri" só é gravado quando o temporizador dispara (assim o StrictMode do desenvolvimento não cancela a abertura).
    const t = setTimeout(() => { try { sessionStorage.setItem(k, "1"); } catch { /* segue */ } mark(); window.location.href = url; }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={mark}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#15803d] text-lg font-bold text-white shadow-[0_14px_36px_-12px_rgba(21,128,61,.8)] transition hover:brightness-110">
        <WhatsAppIcon className="h-6 w-6" /> {label}
      </a>
      {opening && <p className="mt-3 text-center text-sm text-muted" role="status">Abrindo o WhatsApp… se nada acontecer, toque no botão acima.</p>}
    </div>
  );
}
