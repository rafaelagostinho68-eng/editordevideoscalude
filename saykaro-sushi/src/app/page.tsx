import { MenuApp } from "@/components/menu/MenuApp";
import { getMenu } from "@/server/catalog";
import { siteUrl } from "@/server/env";
import { getPublicSettings } from "@/server/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [menu, settings] = await Promise.all([getMenu(), getPublicSettings()]);
  // Dados estruturados (SEO): apenas informações confirmadas — sem endereço nem horários inventados.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: settings.name,
    description: settings.description,
    servesCuisine: "Japonesa",
    url: siteUrl(),
    telephone: `+${settings.whatsappPrimary}`,
    sameAs: settings.instagram ? [`https://instagram.com/${settings.instagram}`] : undefined,
    hasMenu: `${siteUrl()}/`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <MenuApp menu={menu} settings={settings} />
    </>
  );
}
