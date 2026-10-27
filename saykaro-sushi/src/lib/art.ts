/**
 * Qual ilustração usar quando o produto ainda não tem foto (função pura, usada no servidor e no navegador).
 * O desenho em si está em components/brand/FoodArt.tsx.
 */
export type ArtKind = "sushi" | "sashimi" | "entrada" | "gyoza" | "soup" | "harumaki" | "combo" | "yakissoba" | "side" | "torii";

const plain = (s?: string | null) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Escolhe a ilustração: primeiro pelo nome do produto (gyoza, sashimi, missô…), depois pela categoria. */
export function artKind(categoryName?: string | null, productName?: string | null): ArtKind {
  const pn = plain(productName);
  if (/sashimi|cube|carpaccio|tartar/.test(pn)) return "sashimi";
  if (/gyoza|guioza/.test(pn)) return "gyoza";
  if (/misso|miso|sopa/.test(pn)) return "soup";
  const n = plain(categoryName);
  if (/harumaki|rolinho/.test(n)) return "harumaki";
  if (/combo|combina|barca|sushi\s*e\s*sashimi.*combo/.test(n)) return "combo";
  if (/yakissoba|yakisoba|macarr|massa/.test(n)) return "yakissoba";
  if (/sushi|sashimi|temaki|niguiri|nigiri|uramaki|maki/.test(n)) return "sushi";
  if (/entrada|porc|hot|quente|frito/.test(n)) return "entrada";
  if (/acompanh|guarni|bebida|sobremesa|extra|adicion/.test(n)) return "side";
  return "torii";
}

