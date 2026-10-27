import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

/** Estado devolvido pelas Server Actions do painel para os formulários. */
export type FormState = { ok?: boolean; message?: string; error?: string; fields?: Record<string, string>; ts?: number };

export const ok = (message = "Salvo."): FormState => ({ ok: true, message, ts: Date.now() });
export const fail = (error: string, fields?: Record<string, string>): FormState => ({ error, fields, ts: Date.now() });

export function zodFields(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const flag = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "1";

/** O cardápio público é dinâmico, mas revalidamos para garantir que nada fique em cache. */
export function refreshPublic() {
  revalidatePath("/", "layout");
}
