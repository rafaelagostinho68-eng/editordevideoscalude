/**
 * CAMADA DE PAGAMENTO (extensível).
 *
 * Fluxo desejado no futuro (modo ONLINE):
 *   carrinho → pedido (Order, status AWAITING_PAYMENT*) → provider.createCharge() → PaymentRecord(PENDING)
 *   → cliente paga (Pix/cartão) → webhook do gateway → provider.handleWebhook() → PaymentRecord(PAID) → Order RECEIVED
 *   (*status a ser adicionado ao enum OrderStatus quando o modo ONLINE for implementado)
 *
 * Nesta versão só existe o provedor "whatsapp" (sem cobrança). Nada aqui simula pagamento aprovado.
 */
export type ChargeRequest = {
  orderId: number;
  orderCode: string;
  amountCents: number;
  method: "pix" | "credit_card" | "debit_card";
  customer: { name: string; phone: string; email?: string };
  returnUrl: string;
};

export type ChargeResult = {
  externalId: string;
  status: "PENDING" | "PAID" | "FAILED";
  /** Pix: QR/copia-e-cola. Cartão: URL de checkout hospedado, se existir. */
  pix?: { qrCodeBase64?: string; copyPaste: string; expiresAt?: Date };
  redirectUrl?: string;
  raw?: unknown;
};

export type WebhookEvent = { externalId: string; status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED"; raw: unknown };

export interface PaymentProvider {
  readonly id: string; // "mercadopago", "pix-manual", …
  readonly label: string;
  /** false enquanto o provedor ainda não estiver implementado/configurado. */
  isAvailable(): boolean;
  createCharge(req: ChargeRequest): Promise<ChargeResult>;
  /** Valida a assinatura do webhook e converte o payload do gateway em um evento neutro. */
  handleWebhook(headers: Headers, rawBody: string): Promise<WebhookEvent>;
}

export class NotImplementedError extends Error {
  constructor(what: string) { super(`${what} ainda não foi implementado (ver docs/PAGAMENTOS.md).`); }
}
