/** Valores monetários SEMPRE em centavos inteiros. */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

/**
 * Converte texto digitado ("19,99", "R$ 1.234,56", "19.99") em centavos.
 * Retorna null se for inválido ou negativo.
 */
export function parseBRLToCents(input: string): number | null {
  const raw = input.replace(/R\$/gi, "").replace(/\s/g, "");
  if (!raw) return null;
  let normalized: string;
  if (raw.includes(",")) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else {
    const dots = (raw.match(/\./g) || []).length;
    // "1.234" (milhar) vs "19.99" (decimal)
    normalized = dots === 1 && /\.\d{2}$/.test(raw) ? raw : raw.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [int, dec = ""] = normalized.split(".");
  const cents = parseInt(int, 10) * 100 + parseInt((dec + "00").slice(0, 2), 10);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
