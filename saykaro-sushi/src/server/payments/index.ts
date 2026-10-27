import type { PaymentProvider } from "./types";
import { mercadoPagoProvider } from "./mercadopago";

/** Registro de provedores. Para adicionar outro gateway, crie o arquivo e registre aqui. */
const providers: Record<string, PaymentProvider> = {
  [mercadoPagoProvider.id]: mercadoPagoProvider,
};

export function getProvider(id: string): PaymentProvider | null {
  const p = providers[id];
  return p && p.isAvailable() ? p : null;
}

export const availableProviders = () => Object.values(providers).filter((p) => p.isAvailable());
export * from "./types";
