import { markWhatsAppOpened } from "@/server/orders";
import { sameOriginOk } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** Registra que o cliente abriu o WhatsApp. NÃO confirma o pedido (abrir ≠ enviar). */
export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await sameOriginOk())) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const { token } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(token)) return Response.json({ ok: false }, { status: 400 });
  await markWhatsAppOpened(token);
  return Response.json({ ok: true });
}
