import { describe, expect, it } from "vitest";

// Importa só a função pura (o módulo de sessão depende do Next em tempo de execução, mas não na importação).
import { pickClientIp } from "./session";

describe("pickClientIp", () => {
  it("usa o último valor com 1 proxy de confiança (o do meio/esquerda pode ser forjado)", () => {
    expect(pickClientIp("1.1.1.1, 203.0.113.9", null, 1)).toBe("203.0.113.9");
  });
  it("com 2 proxies pula um a mais", () => {
    expect(pickClientIp("6.6.6.6, 203.0.113.9, 10.0.0.2", null, 2)).toBe("203.0.113.9");
  });
  it("sem cabeçalho cai para x-real-ip e depois 0.0.0.0", () => {
    expect(pickClientIp(null, "198.51.100.7", 1)).toBe("198.51.100.7");
    expect(pickClientIp(null, null, 1)).toBe("0.0.0.0");
  });
  it("hops maior que a lista usa o primeiro", () => {
    expect(pickClientIp("203.0.113.9", null, 3)).toBe("203.0.113.9");
  });
});
