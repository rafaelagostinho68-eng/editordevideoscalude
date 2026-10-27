import { db } from "@/server/db";
import { requireAdminApi } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** Resumo leve para o alerta de "novo pedido" do painel (consultado a cada ~20 s com o painel aberto). */
export async function GET() {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const [latest, awaiting, received] = await Promise.all([
    db.order.findFirst({ orderBy: { id: "desc" }, select: { id: true, number: true, customerName: true, totalCents: true } }),
    db.order.count({ where: { status: "AWAITING_WHATSAPP" } }),
    db.order.count({ where: { status: "RECEIVED" } }),
  ]);
  return Response.json({ latest, awaiting, received }, { headers: { "Cache-Control": "no-store" } });
}
