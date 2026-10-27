export type StatusMode = "AUTO" | "OPEN" | "CLOSED";
export type HourRow = { weekday: number; opensAt: string; closesAt: string; enabled: boolean };
export type OpenStatus = {
  state: "open" | "closed" | "unknown";
  label: string;
  detail?: string;
};

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function localParts(now: Date, timeZone: string): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { weekday: map[get("weekday")] ?? 0, minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10) };
}

/** Decide aberto/fechado/desconhecido a partir do modo manual e dos horários semanais. */
export function computeOpenStatus(opts: { statusMode: StatusMode; hours: HourRow[]; timezone: string; now?: Date }): OpenStatus {
  const { statusMode, hours, timezone } = opts;
  if (statusMode === "OPEN") return { state: "open", label: "Aberto agora" };
  if (statusMode === "CLOSED") return { state: "closed", label: "Fechado no momento" };

  const active = hours.filter((h) => h.enabled);
  if (active.length === 0) return { state: "unknown", label: "Confira o horário pelo WhatsApp" };

  const { weekday, minutes } = localParts(opts.now ?? new Date(), timezone);
  for (const h of active) {
    const o = toMin(h.opensAt);
    const c = toMin(h.closesAt);
    if (c > o) {
      if (h.weekday === weekday && minutes >= o && minutes < c) return { state: "open", label: "Aberto agora", detail: `Até ${h.closesAt}` };
    } else {
      // atravessa a meia-noite
      if (h.weekday === weekday && minutes >= o) return { state: "open", label: "Aberto agora", detail: `Até ${h.closesAt}` };
      if ((h.weekday + 1) % 7 === weekday && minutes < c) return { state: "open", label: "Aberto agora", detail: `Até ${h.closesAt}` };
    }
  }
  // próxima abertura
  for (let add = 0; add < 7; add++) {
    const d = (weekday + add) % 7;
    const row = active.find((h) => h.weekday === d);
    if (!row) continue;
    const o = toMin(row.opensAt);
    if (add === 0 && o <= minutes) continue;
    const names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    return { state: "closed", label: "Fechado no momento", detail: add === 0 ? `Abrimos às ${row.opensAt}` : `Abrimos ${names[d]} às ${row.opensAt}` };
  }
  return { state: "closed", label: "Fechado no momento" };
}

export const WEEKDAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
