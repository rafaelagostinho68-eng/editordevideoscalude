"use client";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/** Diálogo acessível: bottom-sheet no celular, janela central (ou painel lateral) no desktop. */
export function Sheet({ open, onClose, title, children, footer, side = false }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; side?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prev.current = document.activeElement as HTMLElement | null;
    const body = document.body;
    const scrollY = window.scrollY;
    const old = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (sbw > 0) body.style.paddingRight = `${sbw}px`;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = old.overflow; body.style.paddingRight = old.paddingRight;
      window.scrollTo(0, scrollY);
      prev.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={`fixed inset-0 z-50 flex ${side ? "md:justify-end" : "md:items-center md:justify-center"} items-end justify-center`}>
      <div className="anim-fade absolute inset-0 bg-black/75 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref} role="dialog" aria-modal="true" aria-label={title}
        className={`anim-sheet relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl ${side ? "md:h-dvh md:max-h-none md:max-w-md md:rounded-none md:border-y-0 md:border-r-0" : "md:max-w-lg md:rounded-3xl"}`}
      >
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-ink backdrop-blur transition hover:bg-black/80">
          <X size={22} />
        </button>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="safe-bottom border-t border-line bg-surface/95 p-4 backdrop-blur">{footer}</div>}
      </div>
    </div>
  );
}
