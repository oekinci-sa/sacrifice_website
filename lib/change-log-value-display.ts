/**
 * Değişiklik kayıtları: Eski → Yeni hücresi ve detay paneli için skaler gösterim.
 * Boş değerler: (Boştu). Parasal kolonlarda ondalık gösterilmez.
 * Saat kolonları: saniye gösterilmez (07:16:00 → 07:16).
 * contacted_at / sacrifice_consent: Türkçe etiketler.
 * IBAN: boştan doluya geçişte "… girişi yapıldı" (Eski → Yeni hücresinde ok yok).
 */

/** Audit’te para tutarı olarak izlenen kolon kodları (snake_case) */
const MONEY_COLUMN_CODES = new Set<string>([
  "share_price",
  "live_scale_total_price",
  "total_amount",
  "paid_amount",
  "remaining_payment",
  "delivery_fee",
  "deposit_amount",
]);

/** Sadece saat / tarih-saat (gösterimde saniye yok) */
const TIME_LIKE_COLUMN_CODES = new Set<string>([
  "planned_delivery_time",
  "slaughter_time",
  "butcher_time",
  "delivery_time",
  "sacrifice_time",
]);

const IBAN_COLUMN_CODES = new Set<string>(["iban"]);

export const CHANGE_LOG_EMPTY_DISPLAY = "(Boştu)";

const GORUSULMEDI = "Görüşülmedi";
const GORUSULDU = "Görüşüldü";
const VEKALET_ALINMADI = "Vekalet alınmadı";
const VEKALET_ALINDI = "Vekalet alındı";

export function isChangeLogMoneyColumn(columnName: string | null | undefined): boolean {
  if (columnName == null || columnName === "") return false;
  return MONEY_COLUMN_CODES.has(columnName.trim());
}

function isTimeLikeColumn(columnName: string | null | undefined): boolean {
  if (columnName == null || columnName === "") return false;
  return TIME_LIKE_COLUMN_CODES.has(columnName.trim());
}

function isIbanColumn(columnName: string | null | undefined): boolean {
  if (columnName == null || columnName === "") return false;
  return IBAN_COLUMN_CODES.has(columnName.trim());
}

/** Sütun adı para benzeri mi (tetikleyicide unutulan kolonlar için yedek) */
function isLikelyMoneyColumnName(columnName: string | null | undefined): boolean {
  if (columnName == null || columnName === "") return false;
  const c = columnName.trim();
  if (MONEY_COLUMN_CODES.has(c)) return true;
  return (
    /_price$/.test(c) ||
    /_amount$/.test(c) ||
    /_fee$/.test(c) ||
    /_payment$/.test(c) ||
    c === "paid_amount" ||
    c === "remaining_payment" ||
    c === "total_amount" ||
    c === "deposit_amount"
  );
}

/**
 * "40000.00", "40.000,00" vb. → tam sayı gösterimi
 */
function formatMoneyLikeString(raw: string): string {
  let s = raw.trim();
  if (s === "") return s;
  // Türkçe: 40.000,50
  if (/^-?\d{1,3}(\.\d{3})*,\d{1,2}$/.test(s) || /^-?\d+,\d{2}$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(s.replace(",", "."));
  if (Number.isFinite(n)) {
    return String(Math.round(n));
  }
  return raw.trim();
}

/** 40000.00 gibi desen (saat 07:16:00 ile karışmasın) */
function looksLikeDecimalMoneyString(s: string): boolean {
  return /^-?\d+(\.\d{1,2}|\,\d{1,2})$/.test(s.trim());
}

function parseBoolLike(value: string): boolean | null {
  const s = value.trim().toLowerCase();
  if (s === "true" || s === "t" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "f" || s === "0" || s === "no") return false;
  return null;
}

function formatContactedAtDisplay(value: string | null): string {
  if (value == null || String(value).trim() === "") return GORUSULMEDI;
  return GORUSULDU;
}

function formatSacrificeConsentDisplay(value: string | null): string {
  if (value == null || String(value).trim() === "") return VEKALET_ALINMADI;
  const parsed = parseBoolLike(String(value));
  if (parsed === true) return VEKALET_ALINDI;
  if (parsed === false) return VEKALET_ALINMADI;
  return String(value).trim();
}

/**
 * PostgreSQL time / timestamptz metni: saniyesiz HH:mm veya tarihli alanlarda saat kısmı
 */
export function formatChangeLogTimeLikeDisplay(value: string | null): string {
  if (value == null || String(value).trim() === "") return CHANGE_LOG_EMPTY_DISPLAY;
  const t = String(value).trim();

  // HH:MM:SS veya HH:MM:SS.mmm
  const hmss = /^(\d{1,2}:\d{2}):\d{2}(?:\.\d+)?$/.exec(t);
  if (hmss) return hmss[1];

  // ISO veya boşluklu tarih-saat
  const isoTime = t.match(/(?:T| )\d{2}:\d{2}:\d{2}/);
  if (isoTime) {
    const hm = t.match(/(\d{2}):(\d{2}):\d{2}/);
    if (hm) {
      const h = parseInt(hm[1], 10);
      const m = hm[2];
      return `${h}:${m}`;
    }
  }

  // Zaten HH:mm
  if (/^\d{1,2}:\d{2}$/.test(t)) return t;

  return t;
}

/**
 * Tek bir değeri gösterir.
 */
export function formatChangeLogScalarDisplay(
  value: string | null,
  columnName: string | null
): string {
  const col = columnName?.trim() ?? "";

  if (col === "contacted_at") {
    return formatContactedAtDisplay(value);
  }
  if (col === "sacrifice_consent") {
    return formatSacrificeConsentDisplay(value);
  }

  if (value == null || String(value).trim() === "") {
    return CHANGE_LOG_EMPTY_DISPLAY;
  }
  const raw = String(value).trim();

  if (isTimeLikeColumn(columnName)) {
    return formatChangeLogTimeLikeDisplay(raw);
  }

  if (isChangeLogMoneyColumn(columnName)) {
    return formatMoneyLikeString(raw);
  }

  if (isLikelyMoneyColumnName(columnName) && looksLikeDecimalMoneyString(raw)) {
    return formatMoneyLikeString(raw);
  }

  // Son çare: para desenli metin (sütun kodu tetikleyicide eksik kalmış olabilir)
  if (looksLikeDecimalMoneyString(raw) && /^-?\d+\.\d{2}$/.test(raw.trim())) {
    return formatMoneyLikeString(raw);
  }

  return raw;
}

/**
 * Detay paneli — Eski Değer: IBAN boş→dolu geçişinde "(Boştu)" yerine kısa çizgi
 */
export function formatChangeLogDetailOldDisplay(
  oldVal: string | null,
  newVal: string | null,
  columnName: string | null
): string {
  const oldEmpty = oldVal == null || String(oldVal).trim() === "";
  const newFilled = newVal != null && String(newVal).trim() !== "";
  if (isIbanColumn(columnName) && oldEmpty && newFilled) {
    return "—";
  }
  return formatChangeLogScalarDisplay(oldVal, columnName);
}

/**
 * Detay paneli — Yeni Değer: IBAN boş→dolu
 */
export function formatChangeLogDetailNewDisplay(
  oldVal: string | null,
  newVal: string | null,
  columnName: string | null
): string {
  const oldEmpty = oldVal == null || String(oldVal).trim() === "";
  const newFilled = newVal != null && String(newVal).trim() !== "";
  if (isIbanColumn(columnName) && oldEmpty && newFilled) {
    return `${String(newVal).trim()} girişi yapıldı`;
  }
  return formatChangeLogScalarDisplay(newVal, columnName);
}

/**
 * Eski → Yeni tek satır metni (tablo hücresi).
 */
export function formatChangeLogOldNewArrow(
  oldVal: string | null,
  newVal: string | null,
  columnName: string | null
): string {
  const col = columnName?.trim() ?? "";

  const oldEmpty = oldVal == null || String(oldVal).trim() === "";
  const newEmpty = newVal == null || String(newVal).trim() === "";

  if (isIbanColumn(columnName) && oldEmpty && !newEmpty) {
    return `${String(newVal).trim()} girişi yapıldı`;
  }

  const left = formatChangeLogScalarDisplay(oldVal, columnName);
  const right = formatChangeLogScalarDisplay(newVal, columnName);
  return `${left} → ${right}`;
}
