import Link from "next/link";
import { GroupForm } from "@/components/admin/GroupForm";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  const cats = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { products: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true, name: true } } } });
  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/adicionais" className="text-sm text-muted hover:text-ink">← Adicionais</Link>
        <h1 className="mt-1 font-display text-2xl font-bold">Novo grupo de opções</h1>
      </header>
      <div className="card">
        <GroupForm data={{ name: "", description: "", required: false, minSelect: 0, maxSelect: 1, active: true, options: [], productIds: [] }} productsByCategory={cats.map((c) => ({ category: c.name, products: c.products }))} />
      </div>
    </div>
  );
}
