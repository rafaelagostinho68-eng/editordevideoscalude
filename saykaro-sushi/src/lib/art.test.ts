import { describe, expect, it } from "vitest";
import { artKind } from "./art";

describe("artKind", () => {
  it("escolhe pelo nome do produto antes da categoria", () => {
    expect(artKind("Entradas", "Gyoza Suína")).toBe("gyoza");
    expect(artKind("Sushi e Sashimi", "Sashimi de Salmão")).toBe("sashimi");
    expect(artKind("Entradas", "Missô (Sopa de Soja)")).toBe("soup");
  });
  it("usa a categoria quando o nome não ajuda", () => {
    expect(artKind("Yakissoba", "Yakissoba Carne")).toBe("yakissoba");
    expect(artKind("Harumakis", "Harumaki Queijo")).toBe("harumaki");
    expect(artKind("Combos", "Combo Hot Frito")).toBe("combo");
    expect(artKind("Sushi e Sashimi", "Sushi Skin")).toBe("sushi");
    expect(artKind("Entradas", "Hot Skin")).toBe("entrada");
    expect(artKind("Acompanhamentos", "Arroz")).toBe("side");
  });
  it("categoria desconhecida cai na torii", () => {
    expect(artKind("Sobremesas Especiais Xyz", "Brigadeiro")).toBe("side");
    expect(artKind("Qualquer Coisa", "Produto")).toBe("torii");
    expect(artKind(null, null)).toBe("torii");
  });
});
