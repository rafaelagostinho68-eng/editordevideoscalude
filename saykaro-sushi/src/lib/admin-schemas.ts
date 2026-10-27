import { z } from "zod";
import { parseBRLToCents } from "./money";
import { normalizeBRPhone } from "./phone";

const text = (max: number) => z.string().trim().max(max).transform((v) => (v === "" ? null : v));
const price = (label: string, { allowZero = false } = {}) =>
  z.string().trim().transform((v, ctx) => {
    const cents = parseBRLToCents(v);
    if (cents === null || (!allowZero && cents <= 0) || cents > 1_000_000_00) {
      ctx.addIssue({ code: "custom", message: `${label} inválido. Use o formato 19,90.` });
      return z.NEVER;
    }
    return cents;
  });
const int = (label: string, min: number, max: number) =>
  z.string().trim().transform((v, ctx) => {
    const n = v === "" ? 0 : Number(v);
    if (!Number.isInteger(n) || n < min || n > max) {
      ctx.addIssue({ code: "custom", message: `${label} deve ser um número inteiro entre ${min} e ${max}.` });
      return z.NEVER;
    }
    return n;
  });

export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  categoryId: int("Categoria", 1, 1_000_000),
  description: text(600),
  portion: text(60),
  price: price("Preço"),
  sortOrder: int("Ordem", -10_000, 10_000),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(60),
  description: text(200),
});

export const modifierGroupSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do grupo.").max(80),
    description: text(200),
    minSelect: int("Mínimo", 0, 50),
    maxSelect: int("Máximo", 1, 50),
  })
  .superRefine((v, ctx) => {
    if (v.minSelect > v.maxSelect) ctx.addIssue({ code: "custom", path: ["minSelect"], message: "O mínimo não pode ser maior que o máximo." });
  });

export const optionRowSchema = z.object({
  id: z.number().int().positive().nullable(),
  name: z.string().trim().min(1).max(80),
  priceCents: z.number().int().min(0).max(1_000_000_00),
  active: z.boolean(),
});

export const zoneRowSchema = z.object({
  id: z.number().int().positive().nullable(),
  name: z.string().trim().min(2).max(80),
  feeCents: z.number().int().min(0).max(1_000_000_00),
  active: z.boolean(),
});

export const paymentRowSchema = z.object({
  id: z.number().int().positive().nullable(),
  label: z.string().trim().min(2).max(60),
  instructions: z.string().trim().max(300).nullable(),
  enabled: z.boolean(),
});

const phoneField = (required: boolean) =>
  z.string().trim().refine((v) => (v === "" ? !required : normalizeBRPhone(v).valid), "Telefone inválido. Use DDD + número, ex.: (21) 98726-7277.");

export const identitySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(60),
  tagline: z.string().trim().max(80),
  description: z.string().trim().max(240),
  instagram: z.string().trim().max(60).transform((v) => v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "")),
  whatsappPrimary: phoneField(true),
  whatsappSecondary: phoneField(false),
  announcement: text(240),
});

export const operationSchema = z.object({
  statusMode: z.enum(["AUTO", "OPEN", "CLOSED"]),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  pausedMessage: text(200),
});

export const hourRowSchema = z
  .object({ weekday: z.number().int().min(0).max(6), enabled: z.boolean(), opensAt: z.string(), closesAt: z.string() })
  .superRefine((v, ctx) => {
    if (!v.enabled) return;
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!hhmm.test(v.opensAt) || !hhmm.test(v.closesAt)) ctx.addIssue({ code: "custom", message: "Horário inválido." });
    else if (v.opensAt === v.closesAt) ctx.addIssue({ code: "custom", message: "Abertura e fechamento não podem ser iguais." });
  });
