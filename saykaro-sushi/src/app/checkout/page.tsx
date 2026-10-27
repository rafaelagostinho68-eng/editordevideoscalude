import type { Metadata } from "next";
import { CheckoutClient } from "@/components/cart/CheckoutClient";
import { getPublicSettings } from "@/server/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Finalizar pedido", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  return <CheckoutClient settings={await getPublicSettings()} />;
}
