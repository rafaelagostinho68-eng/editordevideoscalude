import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../db";
import { hmac, isProd } from "../env";

export const SESSION_DAYS = 7;
/** Em produção usa o prefixo __Host- (exige Secure, Path=/ e sem Domain). */
export const sessionCookieName = () => (isProd() ? "__Host-sk_admin" : "sk_admin");

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * IP do cliente (usado só para limitar tentativas/pedidos).
 * O valor MAIS À ESQUERDA de X-Forwarded-For pode ser forjado pelo cliente; por isso contamos de trás para frente,
 * pulando apenas os proxies de confiança (TRUSTED_PROXY_HOPS, padrão 1 = um proxy/CDN na frente, como Vercel ou Nginx).
 * Sem proxy algum (desenvolvimento local), o cabeçalho simplesmente não existe.
 */
export function pickClientIp(xff: string | null, realIp: string | null, hops = Number(process.env.TRUSTED_PROXY_HOPS ?? 1)): string {
  const parts = (xff ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length > 0) return parts[Math.max(0, parts.length - Math.max(1, hops))].slice(0, 64);
  return (realIp ?? "0.0.0.0").trim().slice(0, 64);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return pickClientIp(h.get("x-forwarded-for"), h.get("x-real-ip"));
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  const h = await headers();
  await db.adminSession.create({
    data: { userId, tokenHash: sha256(token), expiresAt, ipHash: hmac(await clientIp()), userAgent: (h.get("user-agent") ?? "").slice(0, 200) },
  });
  (await cookies()).set(sessionCookieName(), token, { httpOnly: true, secure: isProd(), sameSite: "lax", path: "/", expires: expiresAt });
  // limpeza oportunista de sessões vencidas
  void db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(sessionCookieName());
}

export type AdminIdentity = { id: number; email: string; name: string };

/** Lê o cookie e valida no banco (nunca confia só na existência do cookie). */
export const getAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token || token.length < 20) return null;
  const s = await db.adminSession.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!s || s.expiresAt < new Date() || !s.user.active) return null;
  return { id: s.user.id, email: s.user.email, name: s.user.name };
});

/** Para páginas e Server Actions: redireciona para o login se não houver sessão válida. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  return a;
}

/** Para Route Handlers: devolve 401 em vez de redirecionar. */
export async function requireAdminApi(): Promise<AdminIdentity | Response> {
  const a = await getAdmin();
  return a ?? Response.json({ error: "Não autorizado." }, { status: 401 });
}

/** Defesa extra contra CSRF em rotas POST: a origem precisa ser o próprio site. */
export async function sameOriginOk(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return false;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  try { return new URL(origin).host === host; } catch { return false; }
}
