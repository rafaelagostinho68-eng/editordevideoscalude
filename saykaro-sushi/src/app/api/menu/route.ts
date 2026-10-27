import { getMenu } from "@/server/catalog";
import { getPublicSettings } from "@/server/settings";

export const dynamic = "force-dynamic";

/** Catálogo público atual (usado para revalidar o carrinho no checkout). */
export async function GET() {
  const [menu, settings] = await Promise.all([getMenu(), getPublicSettings()]);
  return Response.json({ menu, settings }, { headers: { "Cache-Control": "no-store" } });
}
