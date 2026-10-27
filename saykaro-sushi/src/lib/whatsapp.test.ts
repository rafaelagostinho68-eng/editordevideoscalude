import { describe, expect, it } from "vitest";
import { buildOrderMessage, buildOrderWhatsAppUrl, orderCode, type MessageOrder } from "./whatsapp";

const base: MessageOrder = {
  number: 123, customerName: "João", customerPhone: "21987654321", fulfillment: "DELIVERY",
  street: "Rua Exemplo", streetNumber: "100", neighborhood: "Centro", reference: "Próximo à praça", complement: null,
  notes: "Sem cebola.", paymentLabel: "Combinar com o restaurante", subtotalCents: 8197, deliveryFeeCents: null, totalCents: 8197,
  items: [
    { productName: "Hot Filadélfia", portion: "10 peças", quantity: 2, unitPriceCents: 1999, optionsCents: 0, lineTotalCents: 3998, options: [] },
    { productName: "Yakissoba de Camarão", quantity: 1, unitPriceCents: 3000, optionsCents: 0, lineTotalCents: 3000, options: [] },
    { productName: "Sushi Salmão", portion: "4 unidades", quantity: 1, unitPriceCents: 1199, optionsCents: 0, lineTotalCents: 1199, options: [] },
  ],
};

describe("mensagem do WhatsApp", () => {
  it("código do pedido", () => expect(orderCode(123)).toBe("SK000123"));
  it("contém todos os dados relevantes", () => {
    const m = buildOrderMessage(base).replace(/ /g, " ");
    for (const part of ["*NOVO PEDIDO - SAYKARO SUSHI*", "#SK000123", "João", "(21) 98765-4321", "2x Hot Filadélfia (10 peças)", "R$ 19,99 cada", "Subtotal: R$ 39,98",
      "1x Yakissoba de Camarão", "Produtos: R$ 81,97", "Entrega: A confirmar", "Total dos produtos: R$ 81,97", "Bairro: Centro", "Endereço: Rua Exemplo, 100",
      "Referência: Próximo à praça", "Pagamento: Combinar com o restaurante", "Observações: Sem cebola."]) expect(m).toContain(part);
  });
  it("retirada não mostra endereço nem taxa a confirmar", () => {
    const m = buildOrderMessage({ ...base, fulfillment: "PICKUP", deliveryFeeCents: 0 });
    expect(m).toContain("Retirada no local");
    expect(m).not.toContain("A confirmar");
    expect(m).not.toContain("Endereço");
  });
  it("taxa conhecida entra no total", () => {
    const m = buildOrderMessage({ ...base, deliveryFeeCents: 500, totalCents: 8697 }).replace(/ /g, " ");
    expect(m).toContain("Entrega: R$ 5,00");
    expect(m).toContain("Total: R$ 86,97");
  });
  it("link wa.me com texto codificado", () => {
    const { url, compact } = buildOrderWhatsAppUrl("5521987267277", base);
    expect(compact).toBe(false);
    expect(url.startsWith("https://wa.me/5521987267277?text=")).toBe(true);
    expect(decodeURIComponent(url.split("?text=")[1])).toContain("#SK000123");
  });
  it("pedido enorme cai para a versão compacta", () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ productName: `Produto de nome bem comprido número ${i}`, quantity: 3, unitPriceCents: 1999, optionsCents: 300, lineTotalCents: 6897, notes: "observação grande ".repeat(8), options: [{ groupName: "Extras", optionName: "Cream cheese", priceCents: 300 }] }));
    const r = buildOrderWhatsAppUrl("5521987267277", { ...base, items });
    expect(r.compact).toBe(true);
    expect(r.url.length).toBeLessThan(4200);
  });
});
