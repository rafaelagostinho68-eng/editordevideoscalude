import { NextResponse, type NextRequest } from "next/server";

/**
 * Primeira barreira da área privada: sem cookie de sessão nem chega às páginas.
 * ATENÇÃO: isto é só um filtro barato (o Edge não acessa o banco). A validação REAL da sessão
 * acontece no servidor, em `requireAdmin()` / `requireAdminApi()`, em cada página, ação e rota.
 */
const COOKIES = ["sk_admin", "__Host-sk_admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (COOKIES.some((n) => (req.cookies.get(n)?.value ?? "").length >= 20)) return NextResponse.next();
  if (pathname.startsWith("/api/admin")) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
