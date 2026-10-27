/** Data/hora no fuso do restaurante (padrão: America/Sao_Paulo). */
export function formatDateTime(d: Date, timeZone = "America/Sao_Paulo"): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatTime(d: Date, timeZone = "America/Sao_Paulo"): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit" }).format(d);
}

/** Instante (UTC) em que começou o dia de hoje no fuso informado. */
export function startOfToday(timeZone = "America/Sao_Paulo", now = new Date()): Date {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now).map((x) => [x.type, x.value]));
  const sinceMidnightMs = ((+p.hour * 60 + +p.minute) * 60 + +p.second) * 1000;
  return new Date(now.getTime() - sinceMidnightMs - now.getMilliseconds());
}
