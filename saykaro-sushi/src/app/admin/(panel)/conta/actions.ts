"use server";
import { db } from "@/server/db";
import { guard } from "@/server/admin/guard";
import { fail, ok, type FormState } from "@/server/admin/form";
import { hashPassword, passwordProblem, verifyPassword } from "@/server/auth/password";
import { loginBlocked, recordLogin } from "@/server/auth/ratelimit";
import { clientIp, createSession } from "@/server/auth/session";

export async function changePassword(_p: FormState, fd: FormData): Promise<FormState> {
  const admin = await guard();
  const ip = await clientIp();
  // Mesmo limite de tentativas do login: quem tem uma sessão roubada não pode ficar adivinhando a senha atual.
  if (await loginBlocked(ip, admin.email)) return fail("Muitas tentativas. Aguarde 15 minutos e tente novamente.");

  const current = String(fd.get("current") ?? "").slice(0, 200);
  const next = String(fd.get("next") ?? "").slice(0, 200);
  const confirm = String(fd.get("confirm") ?? "").slice(0, 200);

  const user = await db.adminUser.findUnique({ where: { id: admin.id } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    await recordLogin(ip, admin.email, false);
    return fail("A senha atual está incorreta.", { current: "A senha atual está incorreta." });
  }
  const problem = passwordProblem(next);
  if (problem) return fail(problem, { next: problem });
  if (next === current) return fail("A nova senha precisa ser diferente da atual.", { next: "A nova senha precisa ser diferente da atual." });
  if (next !== confirm) return fail("A confirmação não confere com a nova senha.", { confirm: "A confirmação não confere com a nova senha." });

  await db.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  await recordLogin(ip, admin.email, true);
  await db.adminSession.deleteMany({ where: { userId: user.id } }); // encerra TODAS as sessões (inclusive de outros aparelhos)
  await createSession(user.id); // e mantém esta
  return ok("Senha alterada. As outras sessões foram encerradas.");
}
