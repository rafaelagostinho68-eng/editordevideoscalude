import { createHmac } from "node:crypto";

/** Segredo da aplicação. Em produção é OBRIGATÓRIO (falha de forma explícita se estiver ausente). */
export function appSecret(): string {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET ausente ou curto demais (mín. 16 caracteres).");
    return "dev-insecure-secret-do-not-use-in-production";
  }
  return s;
}

/** HMAC para guardar IPs/e-mails sem expô-los em texto puro (limites de tentativas). */
export function hmac(value: string): string {
  return createHmac("sha256", appSecret()).update(value).digest("hex");
}

export const isProd = () => process.env.NODE_ENV === "production";
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const uploadDir = () => process.env.UPLOAD_DIR || "./storage/uploads";
