import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToriiIcon } from "@/components/brand/Icons";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth/session";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin(); // sem sessão válida no banco → /admin/login
  const [orders, pending] = await Promise.all([
    db.order.count({ where: { status: { in: ["AWAITING_WHATSAPP", "RECEIVED"] } } }),
    db.catalogPending.count({ where: { resolved: false } }),
  ]);
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside aria-label="Menu do painel" className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 lg:flex-col lg:items-start lg:pt-5">
          <Link href="/admin" className="flex items-center gap-2">
            <ToriiIcon className="h-7 w-7 text-shu" />
            <span className="font-display text-lg font-bold uppercase tracking-[0.1em]">Saykaro</span>
          </Link>
          <div className="flex items-center gap-2 lg:w-full lg:flex-col lg:items-stretch lg:pt-2">
            <Link href="/" target="_blank" className="btn btn-sm" aria-label="Abrir o cardápio em outra aba"><ExternalLink size={16} /> <span className="hidden sm:inline lg:inline">Ver cardápio</span></Link>
          </div>
        </div>
        <div className="px-3 py-3 lg:pt-4"><AdminNav counts={{ orders, pending }} /></div>
        <div className="hidden border-t border-line p-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <Link href="/admin/conta" className="block truncate text-xs text-muted hover:text-ink" title="Minha conta (trocar senha)">{admin.name} · {admin.email}</Link>
          <form action={logoutAction} className="mt-2"><button className="btn btn-sm w-full"><LogOut size={16} /> Sair</button></form>
        </div>
      </aside>
      <div className="min-w-0">
        <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-24 sm:px-6 lg:py-8">{children}</main>
        <footer className="border-t border-line px-4 py-4 text-xs text-muted lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin/conta" className="truncate hover:text-ink">{admin.name} · {admin.email}</Link>
            <form action={logoutAction}><button className="btn btn-sm"><LogOut size={16} /> Sair</button></form>
          </div>
        </footer>
      </div>
    </div>
  );
}
