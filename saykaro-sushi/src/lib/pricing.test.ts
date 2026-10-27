import { describe, expect, it } from "vitest";
import { priceLines, resolveDeliveryFee, orderTotal, type CatalogProduct } from "./pricing";

const hot: CatalogProduct = {
  id: 1, name: "Hot Filadélfia", portion: "10 peças", priceCents: 1999, active: true, soldOut: false,
  groups: [
    { id: 10, name: "Molho", required: true, minSelect: 1, maxSelect: 1, active: true, options: [
      { id: 100, name: "Tarê", priceCents: 0, active: true },
      { id: 101, name: "Shoyu", priceCents: 150, active: true },
      { id: 102, name: "Acabou", priceCents: 0, active: false },
    ] },
    { id: 11, name: "Extras", required: false, minSelect: 0, maxSelect: 2, active: true, options: [
      { id: 110, name: "Cream cheese", priceCents: 300, active: true },
      { id: 111, name: "Gergelim", priceCents: 100, active: true },
      { id: 112, name: "Cebolinha", priceCents: 100, active: true },
    ] },
  ],
};
const yaki: CatalogProduct = { id: 2, name: "Yakissoba de Camarão", portion: null, priceCents: 3000, active: true, soldOut: false, groups: [] };
const off: CatalogProduct = { id: 3, name: "Fora", portion: null, priceCents: 1000, active: false, soldOut: false, groups: [] };
const out: CatalogProduct = { id: 4, name: "Esgotado", portion: null, priceCents: 1000, active: true, soldOut: true, groups: [] };
const catalog = new Map([hot, yaki, off, out].map((p) => [p.id, p]));

describe("priceLines", () => {
  it("calcula usando o preço do servidor e soma em centavos", () => {
    const r = priceLines([
      { productId: 2, quantity: 2, options: [] },
      { productId: 1, quantity: 3, options: [{ groupId: 10, optionId: 101 }, { groupId: 11, optionId: 110 }] },
    ], catalog);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lines[0].lineTotalCents).toBe(6000);
      expect(r.lines[1].optionsCents).toBe(450);
      expect(r.lines[1].lineTotalCents).toBe((1999 + 450) * 3);
      expect(r.subtotalCents).toBe(6000 + 7347);
    }
  });
  it("bloqueia produto inexistente, desativado e esgotado", () => {
    const r = priceLines([{ productId: 99, quantity: 1, options: [] }, { productId: 3, quantity: 1, options: [] }, { productId: 4, quantity: 1, options: [] }], catalog);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.code)).toEqual(["NOT_FOUND", "UNAVAILABLE", "SOLD_OUT"]);
  });
  it("valida quantidade", () => {
    for (const q of [0, -1, 1.5, 51]) {
      const r = priceLines([{ productId: 2, quantity: q, options: [] }], catalog);
      expect(r.ok).toBe(false);
    }
  });
  it("exige opção obrigatória e respeita máximo", () => {
    expect(priceLines([{ productId: 1, quantity: 1, options: [] }], catalog).ok).toBe(false);
    const tooMany = priceLines([{ productId: 1, quantity: 1, options: [{ groupId: 10, optionId: 100 }, { groupId: 11, optionId: 110 }, { groupId: 11, optionId: 111 }, { groupId: 11, optionId: 112 }] }], catalog);
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) expect(tooMany.errors[0].code).toBe("GROUP_MAX");
  });
  it("rejeita opção inativa, de outro produto e duplicada", () => {
    expect(priceLines([{ productId: 1, quantity: 1, options: [{ groupId: 10, optionId: 102 }] }], catalog).ok).toBe(false);
    expect(priceLines([{ productId: 2, quantity: 1, options: [{ groupId: 10, optionId: 100 }] }], catalog).ok).toBe(false);
    const dup = priceLines([{ productId: 1, quantity: 1, options: [{ groupId: 10, optionId: 100 }, { groupId: 11, optionId: 110 }, { groupId: 11, optionId: 110 }] }], catalog);
    expect(dup.ok).toBe(false);
  });
  it("limita e limpa observações", () => {
    const r = priceLines([{ productId: 2, quantity: 1, notes: "  " + "x".repeat(500) + "  ", options: [] }], catalog);
    expect(r.ok && r.lines[0].notes!.length).toBe(200);
  });
});

describe("taxa de entrega", () => {
  it("retirada não tem taxa", () => expect(resolveDeliveryFee("PICKUP", null)).toEqual({ feeCents: 0, status: "NA" }));
  it("zona cadastrada define a taxa", () => expect(resolveDeliveryFee("DELIVERY", { feeCents: 500, active: true })).toEqual({ feeCents: 500, status: "KNOWN" }));
  it("sem zona ou zona inativa = a confirmar (nunca inventa)", () => {
    expect(resolveDeliveryFee("DELIVERY", null)).toEqual({ feeCents: null, status: "TBD" });
    expect(resolveDeliveryFee("DELIVERY", { feeCents: 500, active: false })).toEqual({ feeCents: null, status: "TBD" });
  });
  it("total soma só taxa conhecida", () => {
    expect(orderTotal(8000, { feeCents: null, status: "TBD" })).toBe(8000);
    expect(orderTotal(8000, { feeCents: 500, status: "KNOWN" })).toBe(8500);
  });
});
