import { checkoutSchema } from "@/lib/schemas";
import { createOrder } from "@/server/orders";
import { clientIp, sameOriginOk } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await sameOriginOk())) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 64_000) return Response.json({ error: "Pedido grande demais." }, { status: 413 });

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
    return Response.json({ error: "Confira os dados do pedido.", fields }, { status: 400 });
  }

  const result = await createOrder(parsed.data, await clientIp());
  if (!result.ok) {
    const status = result.reason === "RATE_LIMIT" ? 429 : result.reason === "ITEMS" ? 409 : 422;
    return Response.json({ error: result.message, reason: result.reason, errors: result.errors }, { status });
  }
  return Response.json({ token: result.token, code: result.code, whatsappUrl: result.whatsappUrl, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
}
