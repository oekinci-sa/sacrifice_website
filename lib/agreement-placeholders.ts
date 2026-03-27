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
  const monthName = TR_MONTH_NAMES[branding.full_payment_deadline_month] ?? "";

  return text
    .replace(/\{\{deposit_amount\}\}/g, depositFormatted)
    .replace(/\{\{deposit_deadline_days\}\}/g, String(branding.deposit_deadline_days))
    .replace(/\{\{full_payment_deadline_day\}\}/g, String(branding.full_payment_deadline_day))
    .replace(/\{\{full_payment_deadline_month\}\}/g, String(branding.full_payment_deadline_month))
    .replace(/\{\{full_payment_month_name\}\}/g, monthName);
}
