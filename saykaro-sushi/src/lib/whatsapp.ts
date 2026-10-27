import { formatBRL } from "./money";
import { formatBRPhone } from "./phone";

export type MessageOrder = {
  number: number;
  customerName: string;
  customerPhone: string;
  fulfillment: "DELIVERY" | "PICKUP";
  street?: string | null;
  streetNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  reference?: string | null;
  notes?: string | null;
  paymentLabel: string;
  subtotalCents: number;
  deliveryFeeCents: number | null;
  totalCents: number;
  items: {
    productName: string;
    portion?: string | null;
    quantity: number;
    unitPriceCents: number;
    optionsCents: number;
    lineTotalCents: number;
    notes?: string | null;
    options: { groupName: string; optionName: string; priceCents: number }[];
  }[];
};

export const orderCode = (n: number) => `SK${String(n).padStart(6, "0")}`;

export function buildOrderMessage(o: MessageOrder, restaurantName = "SAYKARO SUSHI"): string {
  const L: string[] = [];
  L.push(`*NOVO PEDIDO - ${restaurantName.toUpperCase()}*`, "");
  L.push(`Pedido: #${orderCode(o.number)}`);
  L.push(`Cliente: ${o.customerName}`);
  L.push(`Telefone: ${formatBRPhone(o.customerPhone)}`, "");
  L.push("*ITENS*", "");
  for (const it of o.items) {
    L.push(`${it.quantity}x ${it.productName}${it.portion ? ` (${it.portion})` : ""}`);
    for (const op of it.options) L.push(`   + ${op.groupName}: ${op.optionName}${op.priceCents ? ` (+${formatBRL(op.priceCents)})` : ""}`);
    if (it.notes) L.push(`   Obs: ${it.notes}`);
    const each = it.unitPriceCents + it.optionsCents;
    if (it.quantity > 1) {
      L.push(`${formatBRL(each)} cada`);
      L.push(`Subtotal: ${formatBRL(it.lineTotalCents)}`);
    } else {
      L.push(formatBRL(it.lineTotalCents));
    }
    L.push("");
  }
  L.push("*VALORES*", "");
  L.push(`Produtos: ${formatBRL(o.subtotalCents)}`);
  if (o.fulfillment === "PICKUP") L.push("Entrega: Retirada no local");
  else L.push(`Entrega: ${o.deliveryFeeCents === null ? "A confirmar" : formatBRL(o.deliveryFeeCents)}`);
  if (o.fulfillment === "DELIVERY" && o.deliveryFeeCents === null) L.push(`Total dos produtos: ${formatBRL(o.totalCents)}`);
  else L.push(`Total: ${formatBRL(o.totalCents)}`);
  L.push("");
  if (o.fulfillment === "DELIVERY") {
    L.push("*ENTREGA*", "");
    L.push(`Nome: ${o.customerName}`);
    if (o.neighborhood) L.push(`Bairro: ${o.neighborhood}`);
    L.push(`Endereço: ${[o.street, o.streetNumber].filter(Boolean).join(", ")}${o.complement ? ` - ${o.complement}` : ""}`);
    if (o.reference) L.push(`Referência: ${o.reference}`);
  } else {
    L.push("*RETIRADA*", "", `Nome: ${o.customerName}`);
  }
  L.push("", `Pagamento: ${o.paymentLabel}`);
  if (o.notes) L.push("", `Observações: ${o.notes}`);
  return L.join("\n");
}

/** Versão curta, usada se a mensagem completa ficar longa demais para a URL do wa.me. */
export function buildCompactMessage(o: MessageOrder, restaurantName = "SAYKARO SUSHI"): string {
  const items = o.items.map((i) => `${i.quantity}x ${i.productName}`).join("; ");
  return [
    `*NOVO PEDIDO - ${restaurantName.toUpperCase()}*`,
    `Pedido: #${orderCode(o.number)} | Cliente: ${o.customerName}`,
    `Itens: ${items}`,
    `Total dos produtos: ${formatBRL(o.subtotalCents)} | ${o.fulfillment === "PICKUP" ? "Retirada" : "Entrega"}`,
    "Detalhes completos no sistema do restaurante.",
  ].join("\n");
}

const MAX_ENCODED = 3800;

export function buildWhatsAppUrl(whatsappDigits: string, message: string): string {
  const digits = whatsappDigits.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildOrderWhatsAppUrl(whatsappDigits: string, order: MessageOrder, restaurantName?: string): { url: string; compact: boolean } {
  const full = buildOrderMessage(order, restaurantName);
  if (encodeURIComponent(full).length <= MAX_ENCODED) return { url: buildWhatsAppUrl(whatsappDigits, full), compact: false };
  return { url: buildWhatsAppUrl(whatsappDigits, buildCompactMessage(order, restaurantName)), compact: true };
}
