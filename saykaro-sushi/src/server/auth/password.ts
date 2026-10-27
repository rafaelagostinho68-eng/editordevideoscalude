import { randomBytes, scrypt as _scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scrypt = (pw: string, salt: Buffer, len: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => _scrypt(pw, salt, len, opts, (e, k) => (e ? reject(e) : resolve(k))));

const N = 2 ** 15, R = 8, P = 1, KEYLEN = 64;
const OPTS: ScryptOptions = { N, r: R, p: P, maxmem: 128 * N * R * 2 };

/** Formato: scrypt$N$r$p$saltBase64$hashBase64 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, OPTS);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, saltB64, hashB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const key = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, { N: +n, r: +r, p: +p, maxmem: 128 * +n * +r * 2 });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

// Hash "de mentira" para gastar o mesmo tempo quando o e-mail não existe (evita enumeração de usuários).
let dummy: Promise<string> | null = null;
export function dummyHash(): Promise<string> {
  return (dummy ??= hashPassword("senha-inexistente-" + randomBytes(8).toString("hex")));
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "A senha precisa ter pelo menos 10 caracteres.";
  if (pw.length > 200) return "Senha longa demais.";
  if (/^(.)\1+$/.test(pw)) return "Escolha uma senha menos previsível.";
  return null;
}
