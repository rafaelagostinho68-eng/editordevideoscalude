/**
 * Sugere qual produto corresponde ao nome de um arquivo de foto (ex.: "hot-filadelfia.jpg" → Hot Filadélfia).
 * Só sugere quando há UM vencedor claro; em caso de dúvida devolve null e a pessoa escolhe.
 */
const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tokens = (s: string) => strip(s).replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter((t) => t.length > 1 && !/^(img|dsc|foto|photo|whatsapp|image|imagem|\d+)$/.test(t));

export function matchProduct(fileName: string, products: { id: number; name: string; hasPhoto?: boolean }[]): number | null {
  const ft = tokens(fileName);
  if (ft.length === 0) return null;
  const fset = new Set(ft);
  let best: { id: number; score: number; noPhoto: boolean }[] = [];
  let top = 0;
  for (const p of products) {
    const pt = tokens(p.name);
    if (pt.length === 0) continue;
    const inter = pt.filter((t) => fset.has(t)).length;
    if (inter === 0) continue;
    // cobre o nome do produto inteiro e o arquivo não traz palavras "a mais" relevantes
    const cover = inter / pt.length, extra = ft.filter((t) => !pt.includes(t)).length / ft.length;
    const score = cover * 0.75 + (1 - extra) * 0.25;
    if (cover < 0.99 && !(pt.length >= 3 && cover >= 0.66)) continue;
    if (score > top + 1e-9) { top = score; best = [{ id: p.id, score, noPhoto: !p.hasPhoto }]; }
    else if (Math.abs(score - top) < 1e-9) best.push({ id: p.id, score, noPhoto: !p.hasPhoto });
  }
  if (best.length === 1) return best[0].id;
  const without = best.filter((b) => b.noPhoto);
  return without.length === 1 ? without[0].id : null;
}
