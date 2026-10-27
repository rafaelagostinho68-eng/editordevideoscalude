"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/server/db";
import { guard } from "@/server/admin/guard";
import { fail, flag, ok, refreshPublic, str, zodFields, type FormState } from "@/server/admin/form";
import { hourRowSchema, identitySchema, operationSchema, paymentRowSchema, zoneRowSchema } from "@/lib/admin-schemas";
import { parseBRLToCents } from "@/lib/money";
import { normalizeBRPhone, toWhatsAppNumber } from "@/lib/phone";
import { slugify } from "@/lib/slug";
import { getSettings } from "@/server/settings";

function done() {
  refreshPublic();
  revalidatePath("/admin", "layout");
}

function parseRows(fd: FormData, key: string): unknown[] | null {
  try {
    const v = JSON.parse(str(fd, key));
    return Array.isArray(v) && v.length <= 200 ? v : null;
  } catch { return null; }
}
const idOf = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null);

export async function saveIdentity(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const parsed = identitySchema.safeParse({
    name: str(fd, "name"), tagline: str(fd, "tagline"), description: str(fd, "description"), instagram: str(fd, "instagram"),
    whatsappPrimary: str(fd, "whatsappPrimary"), whatsappSecondary: str(fd, "whatsappSecondary"), announcement: str(fd, "announcement"),
  });
  if (!parsed.success) return fail("Confira os campos destacados.", zodFields(parsed.error));
  const v = parsed.data;
  await getSettings();
  await db.restaurantSettings.update({
    where: { id: 1 },
    data: {
      name: v.name, tagline: v.tagline, description: v.description, instagram: v.instagram || null,
      whatsappPrimary: toWhatsAppNumber(normalizeBRPhone(v.whatsappPrimary).digits),
      whatsappSecondary: v.whatsappSecondary ? toWhatsAppNumber(normalizeBRPhone(v.whatsappSecondary).digits) : null,
      announcement: v.announcement,
    },
  });
  done();
  return ok("Dados do restaurante salvos.");
}

export async function saveOperation(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const parsed = operationSchema.safeParse({
    statusMode: str(fd, "statusMode"), deliveryEnabled: flag(fd, "deliveryEnabled"), pickupEnabled: flag(fd, "pickupEnabled"), pausedMessage: str(fd, "pausedMessage"),
  });
  if (!parsed.success) return fail("Confira os campos.", zodFields(parsed.error));
  const v = parsed.data;
  if (!v.deliveryEnabled && !v.pickupEnabled) return fail("Deixe pelo menos entrega ou retirada habilitada.", { deliveryEnabled: "Habilite ao menos uma opção." });
  await getSettings();
  await db.restaurantSettings.update({ where: { id: 1 }, data: { statusMode: v.statusMode, deliveryEnabled: v.deliveryEnabled, pickupEnabled: v.pickupEnabled, pausedMessage: v.pausedMessage, ordersPaused: flag(fd, "ordersPaused") } });
  done();
  return ok("Funcionamento atualizado.");
}

/** Botão rápido do painel: pausa/retoma o recebimento de pedidos. */
export async function setOrdersPaused(paused: boolean): Promise<void> {
  await guard();
  await getSettings();
  await db.restaurantSettings.update({ where: { id: 1 }, data: { ordersPaused: paused } });
  done();
}

export async function setStatusMode(mode: "AUTO" | "OPEN" | "CLOSED"): Promise<void> {
  await guard();
  if (!["AUTO", "OPEN", "CLOSED"].includes(mode)) return;
  await getSettings();
  await db.restaurantSettings.update({ where: { id: 1 }, data: { statusMode: mode } });
  done();
}

export async function saveHours(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const rows: z.infer<typeof hourRowSchema>[] = [];
  const errors: Record<string, string> = {};
  for (let d = 0; d < 7; d++) {
    const row = { weekday: d, enabled: flag(fd, `h${d}_on`), opensAt: str(fd, `h${d}_open`), closesAt: str(fd, `h${d}_close`) };
    const r = hourRowSchema.safeParse(row);
    if (!r.success) errors[`h${d}`] = r.error.issues[0]?.message ?? "Horário inválido.";
    else rows.push(r.data);
  }
  if (Object.keys(errors).length) return fail("Corrija os horários indicados.", errors);
  await db.$transaction(rows.map((r) => {
    const data = { enabled: r.enabled, opensAt: r.opensAt || "18:00", closesAt: r.closesAt || "23:00" };
    return db.openingHour.upsert({ where: { weekday: r.weekday }, update: data, create: { weekday: r.weekday, ...data } });
  }));
  done();
  return ok("Horários salvos.");
}

export async function saveZones(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const raw = parseRows(fd, "rows");
  if (!raw) return fail("Dados inválidos.");
  const rows: z.infer<typeof zoneRowSchema>[] = [];
  for (const [i, r] of raw.entries()) {
    const o = r as Record<string, unknown>;
    const fee = parseBRLToCents(String(o.fee ?? ""));
    const parsed = zoneRowSchema.safeParse({ id: idOf(o.id), name: String(o.name ?? ""), feeCents: fee ?? -1, active: o.active !== false });
    if (!parsed.success) return fail(`Linha ${i + 1}: informe o bairro/região e a taxa (ex.: 8,00; use 0 para entrega grátis).`);
    rows.push(parsed.data);
  }
  const names = rows.map((r) => r.name.toLowerCase());
  if (new Set(names).size !== names.length) return fail("Há bairros repetidos na lista.");
  try {
    await db.$transaction(async (tx) => {
      const keep = rows.map((r) => r.id).filter((x): x is number => x !== null);
      await tx.deliveryZone.deleteMany({ where: { id: { notIn: keep } } });
      for (const [i, r] of rows.entries()) {
        const data = { name: r.name, feeCents: r.feeCents, active: r.active, sortOrder: i };
        if (r.id) await tx.deliveryZone.update({ where: { id: r.id }, data });
        else await tx.deliveryZone.create({ data });
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return fail("Há bairros repetidos na lista.");
    throw e;
  }
  done();
  return ok("Taxas de entrega salvas.");
}

export async function savePayments(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const raw = parseRows(fd, "rows");
  if (!raw) return fail("Dados inválidos.");
  const rows: z.infer<typeof paymentRowSchema>[] = [];
  for (const [i, r] of raw.entries()) {
    const o = r as Record<string, unknown>;
    const parsed = paymentRowSchema.safeParse({ id: idOf(o.id), label: String(o.label ?? ""), instructions: String(o.instructions ?? "").trim() || null, enabled: o.enabled !== false });
    if (!parsed.success) return fail(`Linha ${i + 1}: informe o nome da forma de pagamento.`);
    rows.push(parsed.data);
  }
  await db.$transaction(async (tx) => {
    const keep = rows.map((r) => r.id).filter((x): x is number => x !== null);
    await tx.paymentMethod.deleteMany({ where: { id: { notIn: keep } } }); // pedidos antigos guardam o nome (snapshot)
    const used = new Set((await tx.paymentMethod.findMany({ select: { code: true } })).map((m) => m.code));
    for (const [i, r] of rows.entries()) {
      if (r.id) { await tx.paymentMethod.update({ where: { id: r.id }, data: { label: r.label, instructions: r.instructions, enabled: r.enabled, sortOrder: i } }); continue; }
      let code = slugify(r.label), n = 2;
      while (used.has(code)) code = `${slugify(r.label)}-${n++}`;
      used.add(code);
      await tx.paymentMethod.create({ data: { code, label: r.label, instructions: r.instructions, enabled: r.enabled, sortOrder: i } });
    }
  });
  done();
  return ok("Formas de pagamento salvas.");
}
