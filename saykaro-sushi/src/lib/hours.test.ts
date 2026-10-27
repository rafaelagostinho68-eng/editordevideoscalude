import { describe, expect, it } from "vitest";
import { computeOpenStatus, type HourRow } from "./hours";

const tz = "America/Sao_Paulo";
// 2026-10-28 é quarta-feira. 20:00 em São Paulo (UTC-3) = 23:00 UTC.
const wed2000 = new Date("2026-10-28T23:00:00Z");
const hours = (rows: Partial<HourRow>[]): HourRow[] => rows.map((r) => ({ weekday: 3, opensAt: "18:00", closesAt: "23:00", enabled: true, ...r }));

describe("status de funcionamento", () => {
  it("modo manual vence os horários", () => {
    expect(computeOpenStatus({ statusMode: "OPEN", hours: [], timezone: tz, now: wed2000 }).state).toBe("open");
    expect(computeOpenStatus({ statusMode: "CLOSED", hours: hours([{}]), timezone: tz, now: wed2000 }).state).toBe("closed");
  });
  it("sem horários cadastrados = desconhecido (não afirma aberto)", () => {
    expect(computeOpenStatus({ statusMode: "AUTO", hours: [], timezone: tz, now: wed2000 }).state).toBe("unknown");
  });
  it("dentro e fora do horário", () => {
    expect(computeOpenStatus({ statusMode: "AUTO", hours: hours([{}]), timezone: tz, now: wed2000 }).state).toBe("open");
    const early = new Date("2026-10-28T17:00:00Z"); // 14:00 local
    const s = computeOpenStatus({ statusMode: "AUTO", hours: hours([{}]), timezone: tz, now: early });
    expect(s.state).toBe("closed");
    expect(s.detail).toBe("Abrimos às 18:00");
  });
  it("horário que atravessa a meia-noite", () => {
    const rows = hours([{ opensAt: "18:00", closesAt: "01:00" }]);
    expect(computeOpenStatus({ statusMode: "AUTO", hours: rows, timezone: tz, now: new Date("2026-10-29T03:30:00Z") }).state).toBe("open"); // qui 00:30
    expect(computeOpenStatus({ statusMode: "AUTO", hours: rows, timezone: tz, now: new Date("2026-10-29T05:00:00Z") }).state).toBe("closed"); // qui 02:00
  });
  it("dia desativado não conta", () => {
    expect(computeOpenStatus({ statusMode: "AUTO", hours: hours([{ enabled: false }]), timezone: tz, now: wed2000 }).state).toBe("unknown");
  });
});
