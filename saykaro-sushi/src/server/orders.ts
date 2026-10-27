import { randomBytes } from "node:crypto";
import { Prisma, type OrderStatus } from "@prisma/client";
import { db } from "./db";
import { getSettings } from "./settings";
import { getPricingCatalog } from "./catalog";
import { takeRateLimit } from "./auth/ratelimit";
import { orderTotal, priceLines, resolveDeliveryFee, type LineError } from "@/lib/pricing";
import { slugify } from "@/lib/slug";
import { normalizeBRPhone } from "@/lib/phone";
import { buildOrderWhatsAppUrl, orderCode, type MessageOrder } from "@/lib/whatsapp";
import type { CheckoutInput } from "@/lib/schemas";

export type CreateOrderResult =
  | { ok: true; token: string; code: string; whatsappUrl: string; duplicate: boolean }
  | { ok: false; reason: "PAUSED" | "RATE_LIMIT" | "FULFILLMENT_DISABLED" | "PAYMENT_INVALID" | "ITEMS"; message: string; errors?: LineError[] };

const orderInclude = { items: { include: { options: true }, orderBy: { id: "asc" } } } satisfies Prisma.OrderInclude;
type OrderFull = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function toMessageOrder(o: OrderFull): MessageOrder {
  return {
    number: o.number, customerName: o.customerName, customerPhone: o.customerPhone, fulfillment: o.fulfillment,
    street: o.street, streetNumber: o.streetNumber, complement: o.complement, neighborhood: o.neighborhood, reference: o.reference,
    notes: o.notes, paymentLabel: o.paymentLabel, subtotalCents: o.subtotalCents, deliveryFeeCents: o.deliveryFeeCents, totalCents: o.totalCents,
    items: o.items.map((i) => ({
      productName: i.productName, portion: i.portion, quantity: i.quantity, unitPriceCents: i.unitPriceCents, optionsCents: i.optionsCents,
      lineTotalCents: i.lineTotalCents, notes: i.notes, options: i.options.map((x) => ({ groupName: x.groupName, optionName: x.optionName, priceCents: x.priceCents })),
    })),
  };
}

export async function whatsappUrlFor(o: OrderFull, restaurantName: string): Promise<string> {
  return buildOrderWhatsAppUrl(o.whatsappTarget, toMessageOrder(o), restaurantName).url;
}

export async function createOrder(input: CheckoutInput, ip: string): Promise<CreateOrderResult> {
  const settings = await getSettings();

  // Reenvio com a mesma chave = mesmo pedido (nunca duplica).
  const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: orderInclude });
  if (existing) return { ok: true, token: existing.publicToken, code: orderCode(existing.number), whatsappUrl: await whatsappUrlFor(existing, settings.name), duplicate: true };

  if (settings.ordersPaused) return { ok: false, reason: "PAUSED", message: settings.pausedMessage || "No momento não estamos recebendo pedidos. Tente novamente mais tarde." };
  if (!(await takeRateLimit("order:create", ip, 8, 600))) return { ok: false, reason: "RATE_LIMIT", message: "Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente novamente." };
  if (input.fulfillment === "DELIVERY" && !settings.deliveryEnabled) return { ok: false, reason: "FULFILLMENT_DISABLED", message: "Entrega indisponível no momento." };
  if (input.fulfillment === "PICKUP" && !settings.pickupEnabled) return { ok: false, reason: "FULFILLMENT_DISABLED", message: "Retirada indisponível no momento." };

  // Pagamento: só formas habilitadas pelo restaurante.
  const methods = await db.paymentMethod.findMany({ where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  let method = methods.find((m) => m.id === input.paymentMethodId) ?? null;
  if (!method && methods.length === 1 && !input.paymentMethodId) method = methods[0];
  if (methods.length > 0 && !method) return { ok: false, reason: "PAYMENT_INVALID", message: "Escolha uma forma de pagamento." };
  const paymentLabel = method?.label ?? "Combinar com o restaurante";

  // Preços e disponibilidade SEMPRE do banco.
  const catalog = await getPricingCatalog(input.lines.map((l) => l.productId));
  const priced = priceLines(input.lines, catalog);
  if (!priced.ok) return { ok: false, reason: "ITEMS", message: priced.errors[0].message, errors: priced.errors };

  // Taxa de entrega: só se houver zona cadastrada para o bairro; senão "a confirmar".
  let zone: { feeCents: number; active: boolean } | null = null;
  if (input.fulfillment === "DELIVERY" && input.neighborhood) {
    const zones = await db.deliveryZone.findMany({ where: { active: true } });
    const wanted = slugify(input.neighborhood);
    zone = zones.find((z) => slugify(z.name) === wanted) ?? null;
  }
  const fee = resolveDeliveryFee(input.fulfillment, zone);
  const total = orderTotal(priced.subtotalCents, fee);
  const phone = normalizeBRPhone(input.customerPhone).digits;
  const token = randomBytes(18).toString("base64url");

  try {
    const created = await db.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          publicToken: token, idempotencyKey: input.idempotencyKey, status: "AWAITING_WHATSAPP",
          customerName: input.customerName, customerPhone: phone, fulfillment: input.fulfillment,
          street: input.street, streetNumber: input.streetNumber, complement: input.complement, neighborhood: input.neighborhood,
          reference: input.reference, notes: input.notes, paymentMethodId: method?.id ?? null, paymentLabel,
          subtotalCents: priced.subtotalCents, deliveryFeeCents: fee.feeCents, totalCents: total, whatsappTarget: settings.whatsappPrimary,
          items: {
            create: priced.lines.map((l) => ({
              productId: l.productId, productName: l.productName, portion: l.portion, unitPriceCents: l.unitPriceCents,
              optionsCents: l.optionsCents, quantity: l.quantity, lineTotalCents: l.lineTotalCents, notes: l.notes,
              options: { create: l.options.map((x) => ({ groupName: x.groupName, optionName: x.optionName, priceCents: x.priceCents })) },
            })),
          },
          events: { create: { status: "AWAITING_WHATSAPP", note: "Pedido registrado pelo cliente." } },
        },
        include: orderInclude,
      });
      return o;
    });
    return { ok: true, token: created.publicToken, code: orderCode(created.number), whatsappUrl: await whatsappUrlFor(created, settings.name), duplicate: false };
  } catch (e) {
    // Corrida entre dois envios com a mesma chave: devolve o pedido já criado.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: orderInclude });
      if (again) return { ok: true, token: again.publicToken, code: orderCode(again.number), whatsappUrl: await whatsappUrlFor(again, settings.name), duplicate: true };
    }
    throw e;
  }
}

export async function getOrderByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(token)) return null;
  return db.order.findUnique({ where: { publicToken: token }, include: orderInclude });
}

export async function markWhatsAppOpened(token: string) {
  await db.order.updateMany({ where: { publicToken: token, whatsappOpenedAt: null }, data: { whatsappOpenedAt: new Date() } });
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  AWAITING_WHATSAPP: "Aguardando envio pelo WhatsApp",
  RECEIVED: "Recebido",
  PREPARING: "Em preparo",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};
export const ALL_STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];
