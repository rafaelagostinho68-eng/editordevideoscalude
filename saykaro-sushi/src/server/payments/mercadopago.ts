import { NotImplementedError, type PaymentProvider } from "./types";

/**
 * PONTO DE CONEXÃO DO MERCADO PAGO (não implementado de propósito).
 *
 * Para ativar no futuro:
 *  1. Criar a aplicação no painel do Mercado Pago e guardar MERCADOPAGO_ACCESS_TOKEN / MERCADOPAGO_WEBHOOK_SECRET
 *     nas variáveis de ambiente do servidor (nunca no código, nunca no navegador).
 *  2. Implementar createCharge() (Pix: POST /v1/payments; cartão: Checkout Bricks/Preferences) e criar um PaymentRecord PENDING.
 *  3. Criar a rota POST /api/payments/mercadopago/webhook chamando handleWebhook() e atualizando PaymentRecord + Order
 *     (verificar assinatura x-signature e CONSULTAR o pagamento na API antes de marcar como PAID — nunca confiar no corpo do webhook).
 *  4. Mudar RestaurantSettings.checkoutMode para ONLINE e habilitar o fluxo no checkout.
 */
export const mercadoPagoProvider: PaymentProvider = {
  id: "mercadopago",
  label: "Mercado Pago",
  isAvailable: () => false,
  async createCharge() { throw new NotImplementedError("Cobrança via Mercado Pago"); },
  async handleWebhook() { throw new NotImplementedError("Webhook do Mercado Pago"); },
};
