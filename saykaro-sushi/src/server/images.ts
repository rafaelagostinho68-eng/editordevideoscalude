import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { uploadDir } from "./env";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["jpeg", "png", "webp"]);

export class ImageError extends Error {}

async function validate(buf: Buffer) {
  if (buf.length === 0) throw new ImageError("Arquivo vazio.");
  if (buf.length > MAX_UPLOAD_BYTES) throw new ImageError("A imagem passa de 5 MB.");
  // O tipo é decidido pelo CONTEÚDO (sharp lê o cabeçalho real), nunca pela extensão/mime enviados.
  let meta;
  try { meta = await sharp(buf, { limitInputPixels: 50_000_000 }).metadata(); } catch { throw new ImageError("Arquivo de imagem inválido."); }
  if (!meta.format || !ALLOWED.has(meta.format)) throw new ImageError("Use imagens JPG, PNG ou WebP.");
  if ((meta.width ?? 0) < 200 || (meta.height ?? 0) < 150) throw new ImageError("Imagem pequena demais (mínimo 200×150 px).");
  return meta;
}

async function put(name: string, data: Buffer) {
  const dir = path.resolve(uploadDir());
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), data, { mode: 0o644 });
}

/** Foto de produto: sempre 4:3 (recorte central), versão grande e miniatura, em WebP. */
export async function storeProductImage(buf: Buffer) {
  await validate(buf);
  const id = randomUUID();
  const base = sharp(buf, { limitInputPixels: 50_000_000 }).rotate();
  const main = await base.clone().resize(1200, 900, { fit: "cover", position: "attention" }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const thumb = await base.clone().resize(600, 450, { fit: "cover", position: "attention" }).webp({ quality: 78 }).toBuffer();
  const path1 = `${id}.webp`, path2 = `${id}-t.webp`;
  await put(path1, main.data); await put(path2, thumb);
  return { path: path1, thumbPath: path2, width: main.info.width, height: main.info.height };
}

/** Logo: mantém a proporção (sem recorte), até 800 px de largura. */
export async function storeLogo(buf: Buffer) {
  await validate(buf);
  const out = await sharp(buf, { limitInputPixels: 50_000_000 }).rotate().resize({ width: 800, height: 400, fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
  const name = `logo-${randomUUID()}.webp`;
  await put(name, out);
  return name;
}

export async function removeFiles(...names: (string | null | undefined)[]) {
  const dir = path.resolve(uploadDir());
  for (const n of names) {
    if (!n || !/^[A-Za-z0-9._-]+$/.test(n)) continue;
    await unlink(path.join(dir, n)).catch(() => {});
  }
}
