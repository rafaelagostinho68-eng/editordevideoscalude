import { Clock } from "lucide-react";
import type { PublicSettings } from "@/server/settings";
import { Logo } from "../brand/Logo";
import { InstagramIcon, WhatsAppIcon } from "../brand/Icons";
import { ThemeToggle } from "../ThemeToggle";

const dot = { open: "bg-ok", closed: "bg-shu", unknown: "bg-gold" } as const;

export function SiteHeader({ s }: { s: PublicSettings }) {
  const wa = `https://wa.me/${s.whatsappPrimary}`;
  const modes = [s.deliveryEnabled && "Entrega", s.pickupEnabled && "Retirada"].filter(Boolean).join(" · ");
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto max-w-5xl px-4 pb-4 pt-4 sm:pb-6 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="m-0"><span className="sr-only">{s.name} — cardápio digital</span><Logo name={s.name} logoUrl={s.logoUrl} /></h1>
          <ThemeToggle />
        </div>
        <p className="mt-2 text-[15px] text-muted">{s.tagline}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold" role="status">
            <span className={`h-2.5 w-2.5 rounded-full ${dot[s.status.state]}`} aria-hidden="true" />
            {s.status.label}
            {s.status.detail && <span className="flex items-center gap-1 font-normal text-muted"><Clock size={14} />{s.status.detail}</span>}
          </span>
          {modes && <span className="text-muted">{modes}</span>}
        </div>

        <nav className="mt-4 grid grid-cols-2 gap-2.5 sm:flex sm:gap-3" aria-label="Contato">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15803d] px-4 font-semibold text-white transition hover:bg-[#126c33] sm:px-6">
            <WhatsAppIcon className="h-5 w-5" /> WhatsApp
          </a>
          {s.instagram && (
            <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 font-semibold transition hover:bg-surface2 sm:px-6">
              <InstagramIcon className="h-5 w-5" /><span className="sm:hidden">Instagram</span><span className="hidden sm:inline">@{s.instagram}</span>
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
