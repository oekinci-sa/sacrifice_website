import type { TenantBranding } from "@/lib/tenant-branding-defaults";

const TR_MONTH_NAMES = [
  "",
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

/** Tam ödeme ayı (1–12) için Türkçe ay adı; geçersiz indeks için boş string. */
export function getFullPaymentMonthName(monthIndex: number): string {
  return TR_MONTH_NAMES[monthIndex] ?? "";
}

/**
 * Takvim gününün haftanın günü adı (Türkçe, uzun).
 * `Europe/Istanbul` ile yerel takvime göre (örn. 20 Mayıs 2026 → Çarşamba).
 */
export function getFullPaymentWeekdayName(
  year: number,
  month1to12: number,
  day: number
): string {
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month1to12) ||
    !Number.isFinite(day) ||
    month1to12 < 1 ||
    month1to12 > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "";
  }
  const d = new Date(Date.UTC(year, month1to12 - 1, day, 12, 0, 0));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    timeZone: "Europe/Istanbul",
  });
}

/**
 * Sözleşme metinlerindeki yer tutucuları tenant_settings sayılarıyla doldurur.
 * Desteklenen: {{deposit_amount}}, {{deposit_deadline_days}}, {{full_payment_deadline_day}},
 * {{full_payment_deadline_month}}, {{full_payment_month_name}}
 */
export function interpolateAgreementPlaceholders(
  text: string,
  branding: Pick<
    TenantBranding,
    | "deposit_amount"
    | "deposit_deadline_days"
    | "full_payment_deadline_month"
    | "full_payment_deadline_day"
  >
): string {
  const depositFormatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(branding.deposit_amount);
  const monthName = getFullPaymentMonthName(branding.full_payment_deadline_month);

  return text
    .replace(/\{\{deposit_amount\}\}/g, depositFormatted)
    .replace(/\{\{deposit_deadline_days\}\}/g, String(branding.deposit_deadline_days))
    .replace(/\{\{full_payment_deadline_day\}\}/g, String(branding.full_payment_deadline_day))
    .replace(/\{\{full_payment_deadline_month\}\}/g, String(branding.full_payment_deadline_month))
    .replace(/\{\{full_payment_month_name\}\}/g, monthName);
}
