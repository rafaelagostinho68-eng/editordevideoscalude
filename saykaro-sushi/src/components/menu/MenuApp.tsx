"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, AlertTriangle, Check } from "lucide-react";
import type { MenuData, MenuProduct } from "@/server/catalog";
import type { PublicSettings } from "@/server/settings";
import { SiteHeader } from "./SiteHeader";
import { ProductCard } from "./ProductCard";
import { ProductModal } from "./ProductModal";
import { CartBar, CartDrawer } from "./CartUI";
import { useCart } from "../cart/CartProvider";
import { InstagramIcon, WhatsAppIcon } from "../brand/Icons";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Section = { id: string; name: string; description?: string | null; products: MenuProduct[] };

export function MenuApp({ menu, settings }: { menu: MenuData; settings: PublicSettings }) {
  const cart = useCart();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [open, setOpen] = useState<MenuProduct | null>(null);
  const [active, setActive] = useState("destaques");
  const [toast, setToast] = useState<string | null>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const paused = settings.ordersPaused;

  const sections: Section[] = useMemo(() => {
    const hl = menu.products.filter((p) => p.featured || p.isNew);
    const list: Section[] = [];
    if (hl.length) list.push({ id: "destaques", name: "Destaques", products: hl });
    for (const c of menu.categories) {
      const products = menu.products.filter((p) => p.categoryId === c.id);
      if (products.length) list.push({ id: c.slug, name: c.name, description: c.description, products });
    }
    return list;
  }, [menu]);

  const q = norm(query.trim());
  const results = useMemo(() => (q ? menu.products.filter((p) => norm(`${p.name} ${p.description ?? ""} ${p.portion ?? ""}`).includes(q)) : []), [menu.products, q]);

  // destaca a categoria visível durante a rolagem
  useEffect(() => {
    if (q) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let current = sections[0]?.id;
        for (const s of sections) {
          const el = document.getElementById(`sec-${s.id}`);
          if (el && el.getBoundingClientRect().top <= 150) current = s.id;
        }
        if (current) setActive(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [sections, q]);

  useEffect(() => { chipRefs.current[active]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }, [active]);

  const goto = (id: string) => { setActive(id); document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const notify = useCallback((name: string) => { setToast(`${name} adicionado ao carrinho`); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); }, [toast]);

  const needsChoice = (p: MenuProduct) => p.groups.some((g) => g.required || g.minSelect > 0);
  const quickAdd = (p: MenuProduct) => {
    if (needsChoice(p) || p.groups.length > 0) return setOpen(p);
    cart.add({ productId: p.id, name: p.name, portion: p.portion, unitPriceCents: p.priceCents, optionsCents: 0, quantity: 1, notes: "", options: [], thumbUrl: p.thumbUrl });
    notify(p.name);
  };

  const grid = "grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3";

  return (
    <div className="min-h-dvh pb-28">
      <SiteHeader s={settings} />

      {(settings.announcement || paused) && (
        <div className="mx-auto mt-4 max-w-5xl space-y-2 px-4">
          {paused && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-shu/50 bg-shu/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 shrink-0 text-bad" size={18} />
              <p><strong>Pedidos pausados.</strong> {settings.pausedMessage || "No momento não estamos recebendo pedidos pelo cardápio."}</p>
            </div>
          )}
          {settings.announcement && <div className="rounded-2xl border border-gold/50 bg-gold/10 p-4 text-sm text-ink">{settings.announcement}</div>}
        </div>
      )}

      {/* barra fixa: busca + categorias */}
      <div className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5">
          <button
            type="button" aria-label={searchOpen ? "Fechar busca" : "Buscar produto"} aria-expanded={searchOpen}
            onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setQuery(""); }}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${searchOpen ? "border-ink bg-surface2 text-ink" : "border-line bg-surface text-ink"}`}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <nav className="no-scrollbar -mr-3 flex flex-1 gap-2 overflow-x-auto pr-3" aria-label="Categorias">
            {sections.map((s) => (
              <button
                key={s.id} ref={(el) => { chipRefs.current[s.id] = el; }} type="button" onClick={() => { setQuery(""); setSearchOpen(false); goto(s.id); }}
                aria-current={!q && active === s.id ? "true" : undefined}
                className={`h-11 shrink-0 rounded-full border px-4 text-[15px] font-semibold transition ${!q && active === s.id ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink hover:border-muted"}`}
              >
                {s.name}
              </button>
            ))}
          </nav>
        </div>
        {searchOpen && (
          <div className="mx-auto max-w-5xl px-3 pb-3">
            <label htmlFor="busca" className="sr-only">Buscar produto pelo nome</label>
            <input id="busca" data-autofocus autoFocus type="search" inputMode="search" enterKeyHint="search" className="field" placeholder="Buscar produto… (ex.: hot, salmão, yakissoba)" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        )}
      </div>

      <main className="mx-auto max-w-5xl px-4 pt-5">
        {q ? (
          <section aria-live="polite">
            <h2 className="mb-3 font-display text-xl font-bold">{results.length ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"} para “${query.trim()}”` : `Nada encontrado para “${query.trim()}”`}</h2>
            {results.length === 0 && <p className="rounded-2xl border border-line bg-surface p-6 text-center text-muted">Tente outro nome, como “hot”, “salmão” ou “yakissoba”.</p>}
            <div className={grid}>{results.map((p) => <ProductCard key={p.id} p={p} onOpen={setOpen} onQuickAdd={quickAdd} paused={paused} />)}</div>
          </section>
        ) : (
          sections.map((s) => (
            <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-[76px] pb-8" aria-labelledby={`h-${s.id}`}>
              <div className="mb-3 flex items-center gap-3 pt-1">
                <h2 id={`h-${s.id}`} className="text-xl font-extrabold leading-none sm:text-2xl">{s.name}</h2>
              </div>
              {s.description && <p className="-mt-1 mb-3 text-sm text-muted">{s.description}</p>}
              <div className={grid}>{s.products.map((p) => <ProductCard key={`${s.id}-${p.id}`} p={p} onOpen={setOpen} onQuickAdd={quickAdd} paused={paused} />)}</div>
            </section>
          ))
        )}
        {menu.products.length === 0 && <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">O cardápio está sendo atualizado. Volte em instantes.</p>}
      </main>

      <footer className="mx-auto mt-6 max-w-5xl border-t border-line px-4 py-8 text-center text-sm text-muted">
        <p className="font-display text-lg font-bold text-ink">{settings.name}</p>
        <p className="mt-1">{settings.tagline}</p>
        <div className="mt-4 flex justify-center gap-3">
          <a className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 hover:border-gold" href={`https://wa.me/${settings.whatsappPrimary}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>
          {settings.instagram && <a className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 hover:border-gold" href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener noreferrer"><InstagramIcon className="h-4 w-4" /> Instagram</a>}
        </div>
        <p className="mt-6 text-xs">Obrigado pela preferência!</p>
      </footer>

      <ProductModal product={open} onClose={() => setOpen(null)} paused={paused} onAdded={notify} />
      <CartDrawer paused={paused} />
      <CartBar />

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
        {toast && <div className="anim-sheet flex items-center gap-2 rounded-full border border-line bg-surface2 px-4 py-3 text-sm font-medium shadow-xl"><Check size={16} className="text-ok" />{toast}</div>}
      </div>
    </div>
  );
}
