import { z } from "zod";
import { normalizeBRPhone } from "./phone";

export const cartLineSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(200).nullish(),
  options: z.array(z.object({ groupId: z.number().int().positive(), optionId: z.number().int().positive() })).max(30).default([]),
});

const opt = (max: number) => z.string().trim().max(max).nullish().transform((v) => (v ? v : null));

export const checkoutSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    customerName: z.string().trim().min(2, "Informe seu nome.").max(80),
    customerPhone: z.string().trim().min(8, "Informe seu telefone.").max(25),
    fulfillment: z.enum(["DELIVERY", "PICKUP"]),
    street: opt(120),
    streetNumber: opt(20),
    complement: opt(60),
    neighborhood: opt(80),
    reference: opt(120),
    notes: opt(300),
    paymentMethodId: z.number().int().positive().nullish(),
    lines: z.array(cartLineSchema).min(1, "O carrinho está vazio.").max(40),
  })
  .superRefine((v, ctx) => {
    if (!normalizeBRPhone(v.customerPhone).valid) ctx.addIssue({ code: "custom", path: ["customerPhone"], message: "Telefone inválido. Use DDD + número." });
    if (v.fulfillment === "DELIVERY") {
      if (!v.street || v.street.length < 3) ctx.addIssue({ code: "custom", path: ["street"], message: "Informe a rua." });
      if (!v.streetNumber) ctx.addIssue({ code: "custom", path: ["streetNumber"], message: "Informe o número." });
      if (!v.neighborhood || v.neighborhood.length < 2) ctx.addIssue({ code: "custom", path: ["neighborhood"], message: "Informe o bairro." });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const validateCartSchema = z.object({ lines: z.array(cartLineSchema).max(40) });
