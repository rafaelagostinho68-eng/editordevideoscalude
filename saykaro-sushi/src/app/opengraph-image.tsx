import { ImageResponse } from "next/og";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";
export const alt = "Saykaro Sushi — cardápio digital";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagem de pré-visualização (WhatsApp, Instagram, Facebook): gerada com o nome/frase cadastrados no painel. */
export default async function OgImage() {
  const s = await getSettings();
  const [first, ...rest] = s.name.toUpperCase().split(" ");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8f5f0", color: "#1c1917", fontFamily: "serif" }}>
        {/* torii simplificado */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{ width: 150, height: 16, background: "#d3202d", borderRadius: 4 }} />
          <div style={{ width: 120, height: 10, background: "#d3202d", marginTop: 14 }} />
          <div style={{ display: "flex", width: 100, justifyContent: "space-between", marginTop: -2 }}>
            <div style={{ width: 12, height: 70, background: "#d3202d" }} />
            <div style={{ width: 12, height: 70, background: "#d3202d" }} />
          </div>
        </div>
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: 12, lineHeight: 1 }}>{first}</div>
        <div style={{ fontSize: 54, letterSpacing: 26, color: "#cf1f2c", marginTop: 10, fontWeight: 700 }}>{rest.join(" ") || "SUSHI"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 34, color: "#7a5a12", fontSize: 30, letterSpacing: 8 }}>
          <div style={{ width: 70, height: 2, background: "#b08a2e" }} />
          DELIVERY
          <div style={{ width: 70, height: 2, background: "#b08a2e" }} />
        </div>
        <div style={{ marginTop: 40, fontSize: 36, color: "#6b645c" }}>{s.tagline}</div>
      </div>
    ),
    size,
  );
}
