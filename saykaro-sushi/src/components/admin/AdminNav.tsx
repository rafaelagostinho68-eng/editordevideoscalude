"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, ClipboardList, FolderTree, LayoutDashboard, ListChecks, LogOut, MoreHorizontal, Settings, SlidersHorizontal, UserRound, UtensilsCrossed, X } from "lucide-react";
import { logoutAction } from "@/app/admin/login/actions";

type Counts = { orders: number; pending: number; noPhoto: number };
const ITEMS = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, badge: "orders" },
  { href: "/admin/produtos", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/admin/fotos", label: "Fotos", icon: Camera, badge: "noPhoto", quiet: true },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/adicionais", label: "Adicionais", icon: SlidersHorizontal },
  { href: "/admin/configuracoes", label: "Restaurante", icon: Settings },
  { href: "/admin/pendencias", label: "Pendências", icon: ListChecks, badge: "pending" },
] as const;

const isActive = (path: string, it: { href: string; exact?: boolean }) => (it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/"));

/** Menu lateral (computador). No celular o menu fica numa barra fixa embaixo — veja MobileTabs. */
export function AdminNav({ counts }: { counts: Counts }) {
  const path = usePathname();
  return (
    <nav aria-label="Menu do painel" className="hidden flex-col gap-1 lg:flex">
      {ITEMS.map((it) => {
        const active = isActive(path, it);
        const n = "badge" in it ? counts[it.badge] : 0;
        const Icon = it.icon;
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-shu/15 text-ink ring-1 ring-shu/40" : "text-muted hover:bg-surface2 hover:text-ink"}`}>
            <Icon size={18} aria-hidden />
            {it.label}
            {n > 0 && <span className={`ml-auto rounded-full px-1.5 text-[11px] font-bold leading-5 ${"quiet" in it ? "bg-surface2 text-muted" : "bg-shu text-white"}`} aria-label={`${n} pendentes`}>{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

const TABS = [ITEMS[0], ITEMS[1], ITEMS[2], ITEMS[6]] as const;
const MORE = [ITEMS[3], ITEMS[4], ITEMS[5], ITEMS[7]] as const;

/** Barra fixa embaixo no celular: o que o dono mais usa a um toque. */
export function MobileTabs({ counts, userLabel }: { counts: Counts; userLabel: string }) {
  const path = usePathname();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [path]);
  const moreActive = MORE.some((m) => isActive(path, m)) || path.startsWith("/admin/conta");
  const tab = "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition";
  return (
    <>
      <nav aria-label="Menu do painel" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {TABS.map((it) => {
          const active = isActive(path, it);
          const n = "badge" in it ? counts[it.badge] : 0;
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} className={`${tab} relative ${active ? "text-shu-hot" : "text-muted"}`}>
              <span className="relative"><Icon size={22} aria-hidden />{n > 0 && <span className="absolute -right-2.5 -top-1.5 rounded-full bg-shu px-1 text-[10px] font-bold leading-4 text-white" aria-label={`${n} pendentes`}>{n}</span>}</span>
              {it.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" aria-expanded={more} className={`${tab} ${moreActive ? "text-shu-hot" : "text-muted"}`}>
          <MoreHorizontal size={22} aria-hidden /> Mais
        </button>
      </nav>
      {more && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden" role="dialog" aria-modal="true" aria-label="Mais opções">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Fechar" onClick={() => setMore(false)} />
          <div className="anim-sheet relative w-full rounded-t-3xl border border-line bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between"><p className="truncate text-sm text-muted">{userLabel}</p><button type="button" className="btn btn-sm" onClick={() => setMore(false)} aria-label="Fechar"><X size={16} /></button></div>
            <ul className="grid grid-cols-2 gap-2">
              {MORE.map((it) => {
                const Icon = it.icon; const n = "badge" in it ? counts[it.badge] : 0;
                return (
                  <li key={it.href}><Link href={it.href} className={`flex h-14 items-center gap-3 rounded-2xl border px-4 font-semibold ${isActive(path, it) ? "border-shu/50 bg-shu/10" : "border-line bg-surface2"}`}>
                    <Icon size={20} aria-hidden /> {it.label}{n > 0 && <span className="ml-auto rounded-full bg-surface px-2 text-xs text-muted">{n}</span>}
                  </Link></li>
                );
              })}
              <li><Link href="/admin/conta" className="flex h-14 items-center gap-3 rounded-2xl border border-line bg-surface2 px-4 font-semibold"><UserRound size={20} aria-hidden /> Minha conta</Link></li>
              <li><form action={logoutAction}><button className="flex h-14 w-full items-center gap-3 rounded-2xl border border-line bg-surface2 px-4 font-semibold"><LogOut size={20} aria-hidden /> Sair</button></form></li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
