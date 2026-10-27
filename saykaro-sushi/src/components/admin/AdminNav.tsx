"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FolderTree, LayoutDashboard, ListChecks, Settings, SlidersHorizontal, UtensilsCrossed } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, badge: "orders" },
  { href: "/admin/produtos", label: "Produtos", icon: UtensilsCrossed },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/adicionais", label: "Adicionais", icon: SlidersHorizontal },
  { href: "/admin/configuracoes", label: "Restaurante", icon: Settings },
  { href: "/admin/pendencias", label: "Pendências", icon: ListChecks, badge: "pending" },
] as const;

export function AdminNav({ counts }: { counts: { orders: number; pending: number } }) {
  const path = usePathname();
  return (
    <nav aria-label="Menu do painel" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.map((it) => {
        const active = "exact" in it && it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
        const n = "badge" in it ? counts[it.badge] : 0;
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-shu/15 text-ink ring-1 ring-shu/40" : "text-muted hover:bg-surface2 hover:text-ink"}`}
          >
            <Icon size={18} aria-hidden />
            {it.label}
            {n > 0 && <span className="ml-auto rounded-full bg-shu px-1.5 text-[11px] font-bold leading-5 text-white" aria-label={`${n} pendentes`}>{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
