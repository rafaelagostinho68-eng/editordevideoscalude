# Pagamento online (Mercado Pago / Pix / cartão) — arquitetura

**Estado atual (v1): nenhum pagamento online.** O cliente monta o pedido, o sistema o registra e abre o WhatsApp; o pagamento é combinado com o restaurante. Nada aqui simula cobrança aprovada, e não há credenciais de gateway no código.

## Camadas separadas (já existentes)
| Camada | Onde | Observação |
|---|---|---|
| Carrinho | `src/components/cart/CartProvider.tsx` | só IDs/quantidades/opções; preços exibidos são conferidos no servidor |
| Pedido | `src/server/orders.ts`, tabelas `Order*` | totais e “foto” de itens calculados no servidor; status do pedido |
| Forma de pagamento | tabela `PaymentMethod` (painel → Restaurante) | rótulo mostrado ao cliente e gravado no pedido |
| Processamento | `src/server/payments/` (`PaymentProvider`, `mercadopago.ts`) | interface pronta; implementação **stub** (`isAvailable() = false`) |
| Registro/confirmação | tabela `PaymentRecord` (status PENDING/PAID/FAILED/REFUNDED/CANCELLED, `externalId`, `payload`) | uma linha por tentativa de cobrança; `@@unique([provider, externalId])` evita processar o mesmo evento duas vezes |
| Status do pedido | `OrderStatus` + `OrderStatusEvent` | histórico de quem mudou e quando |

`RestaurantSettings.checkoutMode` = `WHATSAPP` (atual) ou `ONLINE` (futuro). Hoje `ONLINE` **não faz nada**.

## Onde plugar o Mercado Pago
1. **Credenciais**: variáveis `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` (já comentadas no `.env.example`) — só no servidor, nunca no navegador.
2. **Implementar** `src/server/payments/mercadopago.ts` seguindo `PaymentProvider` (`createCharge(req) → { externalId, status, pix? , redirectUrl? }` e `handleWebhook(headers, rawBody) → { externalId, status }`, tipos em `payments/types.ts`), trocar `isAvailable()` para `true` quando houver credenciais e registrar em `payments/index.ts` (já registrado).
3. **Criar cobrança** em `src/server/orders.ts` → `createOrder`: quando `checkoutMode === "ONLINE"` e a forma escolhida for online, criar o pedido (status `AWAITING_PAYMENT` — novo valor do enum, via migração aditiva), criar `PaymentRecord(PENDING)` com o **total calculado no servidor** e devolver ao cliente o link/QR Pix/token do cartão.
4. **Webhook**: nova rota `src/app/api/payments/mercadopago/webhook/route.ts` — validar assinatura, buscar o pagamento na API do Mercado Pago (nunca confiar só no corpo recebido), atualizar `PaymentRecord` e só então mudar o pedido para `RECEIVED`/pago. Idempotente (reentrega do mesmo evento não duplica).
5. **UI**: no checkout (`CheckoutClient.tsx`) exibir, para formas online, o botão de pagar/QR em vez de “Enviar pelo WhatsApp”; a página `/pedido/[token]` mostra o status do pagamento.
6. **Painel**: mostrar o `PaymentRecord` no detalhe do pedido; reembolso/cancelamento pelo painel chamando o provedor.
7. **Testes**: usar **credenciais de teste** do Mercado Pago, cobrir webhook repetido, pagamento recusado, expirado e total adulterado (o servidor sempre recalcula).

## Regras a manter
* Valores em centavos inteiros; total sempre do servidor.
* Pedido “pago” só após confirmação do provedor — nunca por parâmetro de URL/retorno do navegador.
* Segredos só em variáveis de ambiente; nenhuma credencial no repositório.
