/**
 * Motor de preços (PURO — sem banco). O servidor carrega o catálogo e chama estas funções;
 * o preço enviado pelo navegador NUNCA é usado.
 */
export type CatalogOption = { id: number; name: string; priceCents: number; active: boolean };
export type CatalogGroup = {
  id: number;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  active: boolean;
  options: CatalogOption[];
};
export type CatalogProduct = {
  id: number;
  name: string;
  portion: string | null;
  priceCents: number;
  active: boolean;
  soldOut: boolean;
  groups: CatalogGroup[];
};

export type CartLineInput = {
  productId: number;
  quantity: number;
  notes?: string | null;
  options: { groupId: number; optionId: number }[];
};

export type PricedLine = {
  productId: number;
  productName: string;
  portion: string | null;
  unitPriceCents: number;
  optionsCents: number;
  quantity: number;
  lineTotalCents: number;
  notes: string | null;
  options: { groupId: number; optionId: number; groupName: string; optionName: string; priceCents: number }[];
};

export type LineError = { index: number; code: "NOT_FOUND" | "UNAVAILABLE" | "SOLD_OUT" | "INVALID_QUANTITY" | "INVALID_OPTION" | "OPTION_UNAVAILABLE" | "GROUP_MIN" | "GROUP_MAX" | "DUPLICATE_OPTION"; message: string; productId: number };

export type PriceResult = { ok: true; lines: PricedLine[]; subtotalCents: number } | { ok: false; errors: LineError[] };

export const MAX_LINES = 40;
export const MAX_QTY = 50;
export const MAX_NOTES = 200;

export function priceLines(inputs: CartLineInput[], catalog: Map<number, CatalogProduct>): PriceResult {
  const errors: LineError[] = [];
  const lines: PricedLine[] = [];

  inputs.forEach((input, index) => {
    const err = (code: LineError["code"], message: string) => errors.push({ index, code, message, productId: input.productId });
    const product = catalog.get(input.productId);
    if (!product) return err("NOT_FOUND", "Produto não encontrado.");
    if (!product.active) return err("UNAVAILABLE", `${product.name} não está mais disponível.`);
    if (product.soldOut) return err("SOLD_OUT", `${product.name} está esgotado no momento.`);
    if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > MAX_QTY)
      return err("INVALID_QUANTITY", `Quantidade inválida para ${product.name}.`);

    const picked: PricedLine["options"] = [];
    const seen = new Set<string>();
    const perGroup = new Map<number, number>();
    let bad = false;

    for (const sel of input.options ?? []) {
      const group = product.groups.find((g) => g.id === sel.groupId);
      if (!group || !group.active) { err("INVALID_OPTION", `Opção inválida em ${product.name}.`); bad = true; continue; }
      const opt = group.options.find((o) => o.id === sel.optionId);
      if (!opt) { err("INVALID_OPTION", `Opção inválida em ${product.name}.`); bad = true; continue; }
      if (!opt.active) { err("OPTION_UNAVAILABLE", `"${opt.name}" não está disponível.`); bad = true; continue; }
      const key = `${group.id}:${opt.id}`;
      if (seen.has(key)) { err("DUPLICATE_OPTION", `Opção repetida em ${product.name}.`); bad = true; continue; }
      seen.add(key);
      perGroup.set(group.id, (perGroup.get(group.id) ?? 0) + 1);
      picked.push({ groupId: group.id, optionId: opt.id, groupName: group.name, optionName: opt.name, priceCents: opt.priceCents });
    }

    for (const group of product.groups.filter((g) => g.active)) {
      const n = perGroup.get(group.id) ?? 0;
      const min = Math.max(group.minSelect, group.required ? 1 : 0);
      if (n < min) { err("GROUP_MIN", `Escolha ${min === 1 ? "uma opção" : `ao menos ${min} opções`} em "${group.name}".`); bad = true; }
      if (n > group.maxSelect) { err("GROUP_MAX", `"${group.name}" permite no máximo ${group.maxSelect}.`); bad = true; }
    }
    if (bad) return;

    const optionsCents = picked.reduce((s, o) => s + o.priceCents, 0);
    const notes = (input.notes ?? "").trim().slice(0, MAX_NOTES) || null;
    lines.push({
      productId: product.id,
      productName: product.name,
      portion: product.portion,
      unitPriceCents: product.priceCents,
      optionsCents,
      quantity: input.quantity,
      lineTotalCents: (product.priceCents + optionsCents) * input.quantity,
      notes,
      options: picked,
    });
  });

  if (errors.length) return { ok: false, errors };
  return { ok: true, lines, subtotalCents: lines.reduce((s, l) => s + l.lineTotalCents, 0) };
}

export type FeeResult = { feeCents: number | null; status: "KNOWN" | "TBD" | "NA" };

/** Taxa: retirada = sem taxa; entrega em zona cadastrada = taxa; senão "a confirmar" (nunca inventa). */
export function resolveDeliveryFee(fulfillment: "DELIVERY" | "PICKUP", zone: { feeCents: number; active: boolean } | null): FeeResult {
  if (fulfillment === "PICKUP") return { feeCents: 0, status: "NA" };
  if (zone && zone.active) return { feeCents: zone.feeCents, status: "KNOWN" };
  return { feeCents: null, status: "TBD" };
}

export function orderTotal(subtotalCents: number, fee: FeeResult): number {
  return subtotalCents + (fee.feeCents ?? 0);
}
