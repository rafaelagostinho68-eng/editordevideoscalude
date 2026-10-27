/**
 * Cria (ou redefine a senha de) um administrador. A senha NUNCA fica no código.
 *
 *   ADMIN_EMAIL=dono@exemplo.com ADMIN_NAME="Dono" ADMIN_PASSWORD='uma-senha-longa' npm run admin:create
 *   (ou execute sem as variáveis em um terminal interativo: o script pergunta; a senha não aparece na tela)
 *
 *   --reset  → redefine a senha de um administrador existente e encerra as sessões dele.
 */
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { PrismaClient } from "@prisma/client";
import { hashPassword, passwordProblem } from "../src/server/auth/password";

const db = new PrismaClient();

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const mute = new Writable({ write(_c, _e, cb) { if (!hidden) process.stdout.write(_c); cb(); } });
    const rl = createInterface({ input: process.stdin, output: mute, terminal: true });
    process.stdout.write(question);
    rl.question("", (a) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(a.trim()); });
  });
}

async function main() {
  const reset = process.argv.includes("--reset");
  const interactive = process.stdin.isTTY;
  const email = (process.env.ADMIN_EMAIL || (interactive ? await ask("E-mail do administrador: ") : "")).toLowerCase();
  const name = process.env.ADMIN_NAME || (interactive ? await ask("Nome: ") : "Administrador");
  const password = process.env.ADMIN_PASSWORD || (interactive ? await ask("Senha (mín. 10 caracteres): ", true) : "");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("E-mail inválido.");
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);

  const found = await db.adminUser.findUnique({ where: { email } });
  if (found && !reset) throw new Error("Já existe um administrador com esse e-mail. Use --reset para redefinir a senha.");
  const passwordHash = await hashPassword(password);
  if (found) {
    await db.adminUser.update({ where: { id: found.id }, data: { passwordHash, name: name || found.name, active: true } });
    await db.adminSession.deleteMany({ where: { userId: found.id } });
    console.log(`Senha de ${email} redefinida; sessões anteriores encerradas.`);
  } else {
    await db.adminUser.create({ data: { email, name: name || "Administrador", passwordHash } });
    console.log(`Administrador ${email} criado. Acesse /admin/login.`);
  }
}

main().catch((e) => { console.error("Erro:", e.message); process.exitCode = 1; }).finally(() => db.$disconnect());
