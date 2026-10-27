/**
 * Testes de integração do pedido (banco PostgreSQL REAL de testes).
 * Só rodam se TEST_DATABASE_URL estiver definido — o banco é LIMPO a cada execução, nunca aponte para produção.
 *   npm test   (lê o .env automaticamente)
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

suite("createOrder (PostgreSQL)", () => {
  type Db = typeof import("./db")["db"];
  let db: Db;
  let createOrder: typeof import("./orders")["createOrder"];
  let ids: { catA: number; pA: number; pSold: number; pOff: number; pOpt: number; grp: number; opt1: number; opt2: number; optOther: number; grpOther: number };
  let ip: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = url; // antes de carregar o Prisma
    ({ db } = await import("./db"));
    ({ createOrder } = await import("./orders"));
    const tables = ["OrderStatusEvent", "OrderItemOption", "OrderItem", "PaymentRecord", "Order", "ProductModifierGroup", "ModifierOption", "ModifierGroup", "ProductImage", "Product", "Category", "DeliveryZone", "PaymentMethod", "OpeningHour", "RateLimitHit", "RestaurantSettings"];
    await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);
    await db.restaurantSettings.create({ data: { id: 1 } });
    const cat = await db.category.create({ data: { name: "Teste", slug: "teste" } });
    const mk = (name: string, priceCents: number, extra: object = {}) => db.product.create({ data: { name, slug: name.toLowerCase().replace(/\W+/g, "-"), categoryId: cat.id, priceCents, ...extra } });
    const [pA, pSold, pOff, pOpt] = await Promise.all([mk("Produto A", 1000), mk("Produto Esgotado", 500, { soldOut: true }), mk("Produto Oculto", 700, { active: false }), mk("Produto Com Opcao", 2000)]);
    const grp = await db.modifierGroup.create({ data: { name: "Molho", required: true, minSelect: 1, maxSelect: 1, options: { create: [{ name: "Tarê", priceCents: 0 }, { name: "Extra picante", priceCents: 300 }] } }, include: { options: true } });
    const other = await db.modifierGroup.create({ data: { name: "Outro grupo", options: { create: [{ name: "X", priceCents: 100 }] } }, include: { options: true } });
    await db.productModifierGroup.create({ data: { productId: pOpt.id, groupId: grp.id } });
    ids = { catA: cat.id, pA: pA.id, pSold: pSold.id, pOff: pOff.id, pOpt: pOpt.id, grp: grp.id, opt1: grp.options[0].id, opt2: grp.options[1].id, optOther: other.options[0].id, grpOther: other.id };
  });

  beforeEach(async () => {
    ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`; // balde de limite próprio por teste
    await db.restaurantSettings.update({ where: { id: 1 }, data: { ordersPaused: false, deliveryEnabled: true, pickupEnabled: true } });
    await db.deliveryZone.deleteMany();
    await db.paymentMethod.deleteMany();
  });

  afterAll(async () => { await db?.$disconnect(); });

  const base = (over: Record<string, unknown> = {}) => ({
    idempotencyKey: randomUUID(), customerName: "Maria Teste", customerPhone: "(21) 98888-7777", fulfillment: "PICKUP" as const,
    street: null, streetNumber: null, complement: null, neighborhood: null, reference: null, notes: null, paymentMethodId: null,
    lines: [{ productId: ids.pA, quantity: 2, notes: null, options: [] }], ...over,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (over?: Record<string, unknown>) => createOrder(base(over) as any, ip);

  it("registra o pedido como 'aguardando envio', com totais calculados pelo servidor e histórico", async () => {
    const r = await make();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const o = await db.order.findUniqueOrThrow({ where: { publicToken: r.token }, include: { items: true, events: true } });
    expect(o.status).toBe("AWAITING_WHATSAPP");
    expect(o.subtotalCents).toBe(2000);
    expect(o.totalCents).toBe(2000);
    expect(o.deliveryFeeCents).toBe(0); // retirada: sem taxa
    expect(o.items[0]).toMatchObject({ productName: "Produto A", unitPriceCents: 1000, quantity: 2, lineTotalCents: 2000 });
    expect(o.events).toHaveLength(1);
    expect(r.whatsappUrl).toMatch(/^https:\/\/wa\.me\/5521987267277\?text=/);
    expect(decodeURIComponent(r.whatsappUrl)).toContain(r.code);
  });

  it("é idempotente: a mesma chave devolve o mesmo pedido sem duplicar", async () => {
    const input = base();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = await createOrder(input as any, ip), b = await createOrder(input as any, ip);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) { expect(b.token).toBe(a.token); expect(b.duplicate).toBe(true); expect(a.duplicate).toBe(false); }
    expect(await db.order.count({ where: { idempotencyKey: input.idempotencyKey } })).toBe(1);
  });

  it("corrida: dois envios simultâneos com a mesma chave geram um único pedido", async () => {
    const input = base();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [a, b] = await Promise.all([createOrder(input as any, ip), createOrder(input as any, ip)]);
    expect(a.ok && b.ok).toBe(true);
    expect(await db.order.count({ where: { idempotencyKey: input.idempotencyKey } })).toBe(1);
  });

  it("recusa produto esgotado, oculto e inexistente", async () => {
    for (const [pid, code] of [[ids.pSold, "SOLD_OUT"], [ids.pOff, "UNAVAILABLE"], [999999, "NOT_FOUND"]] as const) {
      const r = await make({ lines: [{ productId: pid, quantity: 1, notes: null, options: [] }] });
      expect(r.ok).toBe(false);
      if (!r.ok) { expect(r.reason).toBe("ITEMS"); expect(r.errors?.[0].code).toBe(code); }
    }
  });

  it("opções: obrigatório, de outro grupo e adicional pago somado no total", async () => {
    const miss = await make({ lines: [{ productId: ids.pOpt, quantity: 1, notes: null, options: [] }] });
    expect(!miss.ok && miss.errors?.[0].code).toBe("GROUP_MIN");
    const alien = await make({ lines: [{ productId: ids.pOpt, quantity: 1, notes: null, options: [{ groupId: ids.grpOther, optionId: ids.optOther }] }] });
    expect(alien.ok).toBe(false);
    const ok = await make({ lines: [{ productId: ids.pOpt, quantity: 2, notes: "bem passado", options: [{ groupId: ids.grp, optionId: ids.opt2 }] }] });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      const o = await db.order.findUniqueOrThrow({ where: { publicToken: ok.token }, include: { items: { include: { options: true } } } });
      expect(o.subtotalCents).toBe((2000 + 300) * 2);
      expect(o.items[0].options[0]).toMatchObject({ groupName: "Molho", optionName: "Extra picante", priceCents: 300 });
      expect(o.items[0].notes).toBe("bem passado");
    }
  });

  it("entrega: usa a taxa do bairro cadastrado; bairro desconhecido fica 'a confirmar' (sem inventar valor)", async () => {
    await db.deliveryZone.create({ data: { name: "Centro", feeCents: 800 } });
    const addr = { fulfillment: "DELIVERY", street: "Rua A", streetNumber: "1" };
    const known = await make({ ...addr, neighborhood: "centro" }); // sem diferenciar caixa/acentos
    expect(known.ok).toBe(true);
    if (known.ok) { const o = await db.order.findUniqueOrThrow({ where: { publicToken: known.token } }); expect(o.deliveryFeeCents).toBe(800); expect(o.totalCents).toBe(2800); }
    const unknown = await make({ ...addr, neighborhood: "Bairro Distante" });
    expect(unknown.ok).toBe(true);
    if (unknown.ok) { const o = await db.order.findUniqueOrThrow({ where: { publicToken: unknown.token } }); expect(o.deliveryFeeCents).toBeNull(); expect(o.totalCents).toBe(2000); }
  });

  it("pedidos pausados e modalidades desativadas são recusados no servidor", async () => {
    await db.restaurantSettings.update({ where: { id: 1 }, data: { ordersPaused: true } });
    const p = await make();
    expect(!p.ok && p.reason).toBe("PAUSED");
    await db.restaurantSettings.update({ where: { id: 1 }, data: { ordersPaused: false, pickupEnabled: false } });
    const f = await make();
    expect(!f.ok && f.reason).toBe("FULFILLMENT_DISABLED");
  });

  it("forma de pagamento: só as habilitadas pelo restaurante", async () => {
    const on = await db.paymentMethod.create({ data: { code: "pix", label: "Pix na entrega" } });
    await db.paymentMethod.create({ data: { code: "off", label: "Desligada", enabled: false } });
    const bad = await make({ paymentMethodId: 999999 });
    expect(!bad.ok && bad.reason).toBe("PAYMENT_INVALID");
    const good = await make({ paymentMethodId: on.id });
    expect(good.ok).toBe(true);
    if (good.ok) expect((await db.order.findUniqueOrThrow({ where: { publicToken: good.token } })).paymentLabel).toBe("Pix na entrega");
  });

  it("limita pedidos por IP (8 a cada 10 min)", async () => {
    for (let i = 0; i < 8; i++) expect((await make()).ok).toBe(true);
    const r = await make();
    expect(!r.ok && r.reason).toBe("RATE_LIMIT");
  });

  it("pedido guarda 'foto' do momento: mudar preço ou excluir o produto não altera o pedido", async () => {
    const r = await make();
    if (!r.ok) throw new Error("falhou");
    const p = await db.product.create({ data: { name: "Efêmero", slug: `efemero-${Date.now()}`, categoryId: ids.catA, priceCents: 900 } });
    const r2 = await make({ lines: [{ productId: p.id, quantity: 1, notes: null, options: [] }] });
    if (!r2.ok) throw new Error("falhou");
    await db.product.update({ where: { id: p.id }, data: { priceCents: 5000 } });
    await db.product.delete({ where: { id: p.id } });
    const o = await db.order.findUniqueOrThrow({ where: { publicToken: r2.token }, include: { items: true } });
    expect(o.totalCents).toBe(900);
    expect(o.items[0]).toMatchObject({ productId: null, productName: "Efêmero", unitPriceCents: 900 });
  });
});
