import { Clock, Phone } from "lucide-react";
import type { PublicSettings } from "@/server/settings";
import { Logo } from "../brand/Logo";
import { InstagramIcon, WhatsAppIcon } from "../brand/Icons";
import { formatBRPhone } from "@/lib/phone";

const dot = { open: "bg-ok", closed: "bg-shu-hot", unknown: "bg-gold" } as const;

export function SiteHeader({ s }: { s: PublicSettings }) {
  const wa = `https://wa.me/${s.whatsappPrimary}`;
  return (
    <header className="relative isolate overflow-hidden border-b border-line">
      <div className="seigaiha absolute inset-0 -z-10 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(211,32,45,.22),transparent_62%)]" />
      <div className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-5 pt-7 text-center sm:pb-8 sm:pt-12">
        <h1 className="m-0"><span className="sr-only">{s.name} — cardápio digital</span><Logo name={s.name} logoUrl={s.logoUrl} /></h1>
        <p className="mt-4 hidden max-w-md text-[15px] text-muted sm:block">{s.description}</p>
        <p className="mt-3 font-display text-lg italic text-gold-soft sm:mt-1">{s.tagline}</p>

        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-2 text-sm backdrop-blur" role="status">
          <span className={`h-2.5 w-2.5 rounded-full ${dot[s.status.state]}`} aria-hidden="true" />
          <span className="font-semibold">{s.status.label}</span>
          {s.status.detail && <span className="flex items-center gap-1 text-muted"><Clock size={14} />{s.status.detail}</span>}
        </div>

        <nav className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:max-w-none sm:justify-center sm:gap-3" aria-label="Contato">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#15803d] px-4 font-semibold text-white transition hover:brightness-110 sm:px-5">
            <WhatsAppIcon className="h-5 w-5" /> WhatsApp
          </a>
          {s.instagram && (
            <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 font-semibold transition hover:border-gold sm:px-5">
              <InstagramIcon className="h-5 w-5" /><span className="sm:hidden">Instagram</span><span className="hidden sm:inline">@{s.instagram}</span>
            </a>
          )}
        </nav>
        {s.whatsappSecondary && (
          <p className="mt-3 hidden items-center gap-1.5 text-xs text-muted sm:flex"><Phone size={13} /> {formatBRPhone(s.whatsappPrimary)} · {formatBRPhone(s.whatsappSecondary)}</p>
        )}
      </div>
    </header>
  );
}
