import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/server/env";

export const dynamic = "force-dynamic";

// Só nomes gerados pelo próprio sistema (UUID + .webp). Qualquer outra coisa → 404 (sem path traversal).
const SAFE = /^(logo-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-t)?\.webp$/;

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!SAFE.test(name)) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(path.join(path.resolve(uploadDir()), name));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable", // o nome muda a cada upload
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
