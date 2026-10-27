"use server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { dummyHash, verifyPassword } from "@/server/auth/password";
import { loginBlocked, recordLogin } from "@/server/auth/ratelimit";
import { clientIp, createSession, destroySession } from "@/server/auth/session";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(fd.get("password") ?? "").slice(0, 200);
  const ip = await clientIp();

  // Bloqueio ANTES de conferir a senha: quem está bloqueado não consegue nem testar.
  if (await loginBlocked(ip, email)) return { error: "Muitas tentativas. Aguarde 15 minutos e tente novamente." };

  const user = email ? await db.adminUser.findUnique({ where: { email } }) : null;
  // Sempre gasta o mesmo tempo (hash de mentira se o e-mail não existe) → não revela quais e-mails existem.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !user.active || !ok) {
    await recordLogin(ip, email, false);
    return { error: "E-mail ou senha incorretos." };
  }
  await recordLogin(ip, email, true);
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
