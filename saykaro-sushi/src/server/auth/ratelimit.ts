import { db } from "../db";
import { hmac } from "../env";

const WINDOW_MIN = 15;
const MAX_PER_ACCOUNT = 5; // por IP + e-mail
const MAX_PER_IP = 30;

export async function loginBlocked(ip: string, email: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000);
  const [acct, byIp] = await Promise.all([
    db.loginAttempt.count({ where: { key: hmac(`${ip}|${email.toLowerCase()}`), success: false, createdAt: { gte: since } } }),
    db.loginAttempt.count({ where: { key: hmac(`ip|${ip}`), success: false, createdAt: { gte: since } } }),
  ]);
  return acct >= MAX_PER_ACCOUNT || byIp >= MAX_PER_IP;
}

export async function recordLogin(ip: string, email: string, success: boolean): Promise<void> {
  await db.loginAttempt.createMany({
    data: [
      { key: hmac(`${ip}|${email.toLowerCase()}`), success },
      { key: hmac(`ip|${ip}`), success },
    ],
  });
  if (success) await db.loginAttempt.deleteMany({ where: { key: hmac(`${ip}|${email.toLowerCase()}`) } });
  void db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } }).catch(() => {});
}

/** Limite genérico (ex.: criação de pedidos). Devolve true se ainda pode prosseguir e já registra o uso. */
export async function takeRateLimit(bucket: string, ip: string, max: number, windowSec: number): Promise<boolean> {
  const key = hmac(ip);
  const since = new Date(Date.now() - windowSec * 1000);
  const n = await db.rateLimitHit.count({ where: { bucket, key, createdAt: { gte: since } } });
  if (n >= max) return false;
  await db.rateLimitHit.create({ data: { bucket, key } });
  void db.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } }).catch(() => {});
  return true;
}
