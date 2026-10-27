import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Search } from "lucide-react";
import { ProductImage } from "@/components/menu/ProductImage";
import { formatBRL } from "@/lib/money";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { moveProduct, setProductFlag } from "./actions";

export const dynamic = "force-dynamic";

const ESTADOS = [
  { v: "", label: "Todos" },
  { v: "visiveis", label: "Visíveis" },
  { v: "ocultos", label: "Ocultos" },
  { v: "esgotados", label: "Esgotados" },
  { v: "semfoto", label: "Sem foto" },
];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; estado?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const cat = Number(sp.cat) || undefined;
  const estado = sp.estado ?? "";

  const where: Prisma.ProductWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(cat ? { categoryId: cat } : {}),
    ...(estado === "visiveis" ? { active: true } : estado === "ocultos" ? { active: false } : estado === "esgotados" ? { soldOut: true } : estado === "semfoto" ? { images: { none: {} } } : {}),
  };
  const [cats, products, total] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.product.findMany({ where, include: { category: true, images: { take: 1 } }, orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { id: "asc" }] }),
    db.product.count(),
  ]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Produtos</h1>
          <p className="mt-1 text-sm text-muted">{total} produto{total === 1 ? "" : "s"} cadastrado{total === 1 ? "" : "s"}. Mudanças aparecem no cardápio na hora.</p>
        </div>
        <Link href="/admin/produtos/novo" className="btn btn-primary"><Plus size={18} /> Novo produto</Link>
      </header>

      <form className="card grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end" role="search">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="q" className="lbl">Buscar por nome</label>
          <input id="q" name="q" defaultValue={q} className="field" placeholder="Ex.: Hot Filadélfia" />
        </div>
        <div>
          <label htmlFor="cat" className="lbl">Categoria</label>
          <select id="cat" name="cat" defaultValue={cat ?? ""} className="field">
            <option value="">Todas</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="estado" className="lbl">Situação</label>
          <select id="estado" name="estado" defaultValue={estado} className="field">
            {ESTADOS.map((e) => <option key={e.v} value={e.v}>{e.label}</option>)}
          </select>
        </div>
        <button className="btn col-span-2 sm:col-span-1"><Search size={18} /> Filtrar</button>
      </form>

      <ul className="space-y-3">
        {products.map((p) => {
          const first = p.images[0];
          const siblings = products.filter((x) => x.categoryId === p.categoryId);
          const idx = siblings.findIndex((x) => x.id === p.id);
          const canReorder = !q && estado === "" ; // setas só fazem sentido sem filtro de nome/estado
          return (
            <li key={p.id} className="card flex gap-3">
              <div className="w-24 shrink-0 self-start overflow-hidden rounded-xl border border-line sm:w-28"><ProductImage src={first ? `/media/${first.thumbPath}` : null} thumb={null} alt={p.name} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link href={`/admin/produtos/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                  {!p.active && <span className="chip chip-warn">Oculto</span>}
                  {p.soldOut && <span className="chip chip-bad">Esgotado</span>}
                  {p.featured && <span className="chip chip-ok">Destaque</span>}
                  {p.isNew && <span className="chip chip-ok">Novo</span>}
                  {!first && <span className="chip">Sem foto</span>}
                </div>
                <p className="text-sm text-muted">{p.category.name}{p.portion ? ` · ${p.portion}` : ""} · <span className="font-semibold text-gold-soft">{formatBRL(p.priceCents)}</span></p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {canReorder && (
                    <>
                      <form action={moveProduct.bind(null, p.id, "up")}><button className="btn btn-sm" disabled={idx === 0} aria-label={`Subir ${p.name}`}><ArrowUp size={16} /></button></form>
                      <form action={moveProduct.bind(null, p.id, "down")}><button className="btn btn-sm" disabled={idx === siblings.length - 1} aria-label={`Descer ${p.name}`}><ArrowDown size={16} /></button></form>
                    </>
                  )}
                  <form action={setProductFlag.bind(null, p.id, "soldOut", !p.soldOut)}><button className="btn btn-sm">{p.soldOut ? "Voltou ao estoque" : "Marcar esgotado"}</button></form>
                  <form action={setProductFlag.bind(null, p.id, "active", !p.active)}>
                    <button className="btn btn-sm">{p.active ? <><EyeOff size={16} /> Ocultar</> : <><Eye size={16} /> Mostrar</>}</button>
                  </form>
                  <Link href={`/admin/produtos/${p.id}`} className="btn btn-sm">Editar</Link>
                </div>
              </div>
            </li>
          );
        })}
        {products.length === 0 && <li className="card text-sm text-muted">Nenhum produto encontrado com esses filtros.</li>}
      </ul>
    </div>
  );
}
