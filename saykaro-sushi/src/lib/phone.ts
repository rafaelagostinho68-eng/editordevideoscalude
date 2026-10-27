/** Telefones brasileiros: devolve só dígitos (sem DDI) e valida o tamanho. */
export function normalizeBRPhone(input: string): { digits: string; valid: boolean } {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  const valid = (d.length === 10 || d.length === 11) && /^[1-9]{2}/.test(d) && (d.length === 10 || d[2] === "9");
  return { digits: d, valid };
}

export function formatBRPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

/** Número para o link wa.me: dígitos com DDI 55. */
export function toWhatsAppNumber(input: string): string {
  const d = input.replace(/\D/g, "");
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}
