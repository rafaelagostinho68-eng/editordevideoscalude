import { describe, expect, it } from "vitest";
import { matchProduct } from "./photo-match";

const P = [
  { id: 1, name: "Hot Filadélfia" }, { id: 2, name: "Haru Filadélfia" }, { id: 3, name: "Yakissoba de Salmão" },
  { id: 4, name: "Yakissoba Salmão e Camarão" }, { id: 5, name: "Combo Hot Frito" }, { id: 6, name: "Gyoza Suína" }, { id: 7, name: "Gyoza Frango" },
];

describe("matchProduct", () => {
  it("casa por nome ignorando acentos, caixa, separadores e extensão", () => {
    expect(matchProduct("hot-filadelfia.jpg", P)).toBe(1);
    expect(matchProduct("HOT_FILADÉLFIA.PNG", P)).toBe(1);
    expect(matchProduct("Gyoza Frango.webp", P)).toBe(7);
  });
  it("prefere o nome mais completo", () => {
    expect(matchProduct("yakissoba salmao e camarao.jpg", P)).toBe(4);
    expect(matchProduct("yakissoba-de-salmao.jpg", P)).toBe(3);
  });
  it("não chuta quando há dúvida ou nada parecido", () => {
    expect(matchProduct("IMG_20240101_1234.jpg", P)).toBeNull();
    expect(matchProduct("filadelfia.jpg", P)).toBeNull(); // Hot ou Haru?
    expect(matchProduct("gyoza.jpg", P)).toBeNull();
    expect(matchProduct("sorvete.jpg", P)).toBeNull();
  });
  it("desempata a favor de quem ainda não tem foto", () => {
    expect(matchProduct("gyoza.jpg", [{ id: 6, name: "Gyoza", hasPhoto: true }, { id: 7, name: "Gyoza", hasPhoto: false }])).toBe(7);
  });
});
