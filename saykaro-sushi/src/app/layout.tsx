import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/shippori-mincho/latin-500.css";
import "@fontsource/shippori-mincho/latin-700.css";
import "@fontsource/shippori-mincho/latin-800.css";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { siteUrl } from "@/server/env";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = `${s.name} Delivery — Cardápio digital`;
  const description = `${s.description} ${s.tagline}. Monte seu pedido e finalize pelo WhatsApp.`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${s.name}` },
    description,
    applicationName: s.name,
    openGraph: { type: "website", locale: "pt_BR", siteName: s.name, title, description, url: "/" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = { themeColor: "#0a0a0c", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
