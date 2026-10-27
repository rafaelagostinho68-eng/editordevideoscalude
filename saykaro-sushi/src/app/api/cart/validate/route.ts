import { getPricingCatalog } from "@/server/catalog";
import { priceLines } from "@/lib/pricing";
import { validateCartSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/**
 * Recalcula o carrinho com os preços e a disponibilidade ATUAIS do servidor.
 * O navegador usa isto só para mostrar valores corretos — o pedido é recalculado de novo ao ser registrado.
 */
export async function POST(req: Request) {
  const parsed = validateCartSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Carrinho inválido." }, { status: 400 });
  const lines = parsed.data.lines;
  if (lines.length === 0) return Response.json({ ok: true, lines: [], subtotalCents: 0 });

  const catalog = await getPricingCatalog(lines.map((l) => l.productId));
  // valida item a item para devolver quais linhas têm problema sem derrubar o carrinho todo
  const out = lines.map((l, index) => {
    const r = priceLines([{ ...l, notes: l.notes ?? null }], catalog);
    return r.ok ? { index, ok: true as const, line: r.lines[0] } : { index, ok: false as const, error: r.errors[0] };
  });
  const good = out.flatMap((o) => (o.ok ? [o.line] : []));
  return Response.json({
    ok: out.every((o) => o.ok),
    lines: out,
    subtotalCents: good.reduce((s, l) => s + l.lineTotalCents, 0),
  }, { headers: { "Cache-Control": "no-store" } });
}
