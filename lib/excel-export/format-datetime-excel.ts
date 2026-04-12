/** Türkiye saati (Europe/Istanbul) — Excel için tarih ve saat ayrı sütunlar */

const TZ = "Europe/Istanbul";

function padTimeParts(h: string, min: string, sec: string): string {
  return `${h.padStart(2, "0")}:${min}:${sec}`;
}

/** "14:30" veya "14:30:00" gibi saf saat metni */
function parseTimeOnlyString(s: string): string | null {
  const t = s.trim();
  const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return padTimeParts(m[1], m[2], m[3] ?? "00");
}

/**
 * ISO veya tarih+saat içeren değerler için [gg.aa.yyyy, ss:dd:ss]; saf saat için ["", "14:30:00"].
 */
export function splitDateTimeForExcel(value: unknown): [string, string] {
  if (value == null || value === "") return ["", ""];

  const raw = typeof value === "string" ? value : String(value);
  const trimmed = raw.trim();

  const timeOnly = parseTimeOnlyString(trimmed);
  if (timeOnly) {
    return ["", timeOnly];
  }

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return [trimmed, ""];
  }

  const datePart = d.toLocaleDateString("tr-TR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timePart = d.toLocaleTimeString("tr-TR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return [datePart, timePart];
}
