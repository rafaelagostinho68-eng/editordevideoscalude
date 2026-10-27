import { requireAdmin, type AdminIdentity } from "@/server/auth/session";

/**
 * Todo Server Action do painel começa com `await guard()`.
 * A sessão é conferida no banco a cada chamada: não basta o cookie existir nem o usuário "ter chegado" à página.
 * (O Next.js já rejeita Server Actions cujo Origin difere do Host — proteção CSRF nativa.)
 */
export async function guard(): Promise<AdminIdentity> {
  return requireAdmin();
}
