import { describe, expect, it } from "vitest";
import { centsToInput, formatBRL, parseBRLToCents } from "./money";

describe("money", () => {
  it("formata em reais", () => {
    expect(formatBRL(1999).replace(/\s/g, " ")).toBe("R$ 19,99");
    expect(formatBRL(5500).replace(/\s/g, " ")).toBe("R$ 55,00");
  });
  it("interpreta entradas comuns", () => {
    expect(parseBRLToCents("19,99")).toBe(1999);
    expect(parseBRLToCents("19.99")).toBe(1999);
    expect(parseBRLToCents("R$ 1.234,56")).toBe(123456);
    expect(parseBRLToCents("30")).toBe(3000);
    expect(parseBRLToCents("1.234")).toBe(123400);
    expect(parseBRLToCents("7,5")).toBe(750);
  });
  it("rejeita valores inválidos", () => {
    for (const bad of ["", "abc", "-5", "1,2,3", "12,345"]) expect(parseBRLToCents(bad)).toBeNull();
  });
  it("ida e volta", () => {
    expect(parseBRLToCents(centsToInput(2299))).toBe(2299);
  });
});
