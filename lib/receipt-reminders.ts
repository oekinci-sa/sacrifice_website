import {
  getFullPaymentMonthName,
  getFullPaymentWeekdayName,
} from "@/lib/agreement-placeholders";
import type { TenantBranding } from "@/lib/tenant-branding-defaults";
import { DEFAULT_BRANDING } from "@/lib/tenant-branding-defaults";
import { formatIbanForDisplay } from "@/utils/formatters";

/** PDF / e-posta / hatırlatma metinlerinde IBAN sahibi satırı için ortak etiket. */
export const IBAN_ACCOUNT_HOLDER_FIELD_LABEL = "IBAN Sahibi Ad Soyad";

/**
 * `tenant_settings.iban_account_holder` doluysa ad soyad; boşsa gösterilmez (tüm tenant’lar).
 */
export function getIbanAccountHolderDisplay(
  branding: Pick<TenantBranding, "iban_account_holder"> | null | undefined
): string | null {
  const b = branding ?? DEFAULT_BRANDING;
  const name = b.iban_account_holder?.trim();
  return name ? name : null;
}

export type ReceiptReminderItem = {
  src: string;
  header: string;
  description: string;
};

type BrandingDepositFields = Pick<
  TenantBranding,
  | "deposit_amount"
  | "deposit_deadline_days"
  | "full_payment_deadline_month"
  | "full_payment_deadline_day"
  | "active_sacrifice_year"
  | "iban"
  | "iban_account_holder"
>;

export type BuildReceiptRemindersOptions = {
  /**
   * false: “Kapora IBAN Bilgisi” maddesini ekleme
   * (PDF/e-postada Ödeme Bilgileri’nde zaten var). Varsayılan: true (ana sayfa üçlü kutu).
   */
  includeKaporaIbanReminder?: boolean;
  /**
   * false: “Kapora Ödeme Süresi” maddesini ekleme
   * (PDF/e-posta Önemli Notlar’da yalnızca tam ödeme tarihi kalsın). Varsayılan: true.
   */
  includeKaporaPaymentDeadlineReminder?: boolean;
};

/** Ödeme tablosu: "Kapora" satırı değeri — örn. `5.000 TL` (DB `deposit_amount`). */
export function formatKaporaTlForReceipt(
  branding: BrandingDepositFields | null | undefined
): string {
  const b = branding ?? DEFAULT_BRANDING;
  return (
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(b.deposit_amount) + " TL"
  );
}

/** PDF/e-posta `delivery_fee` / `share_price` string alanlarından TL tutarı */
export function parseReceiptTlAmountString(s: string | null | undefined): number {
  if (s == null || String(s).trim() === "") return 0;
  const n = parseFloat(String(s).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** PDF/e-posta ödeme tablosu satır etiketleri (ayrı satırlar). */
export const KAPORA_PAYMENT_ROW_LABEL = "Kapora";
/** Admin PDF’te kapora 0 seçildiğinde kullanılan satır etiketi */
export const KAPORA_PAYMENT_ROW_LABEL_FULL = "Kapora Ücreti";
/** Admin PDF’te özel kapora 0: gösterilecek metin */
export const KAPORA_WAIVED_DISPLAY = "Kapora alınmayacak";
export const IBAN_PAYMENT_ROW_LABEL = "IBAN";
/** Kullanıcı örneğindeki gibi kısa etiket ("IBAN Sahibi Ad Soyad" değil). */
export const IBAN_HOLDER_PAYMENT_ROW_LABEL = "IBAN Sahibi";

/**
 * @deprecated Birleşik tek satır; yeni şablonlarda `formatKaporaTlForReceipt` +
 * `formatIbanForDisplay(iban)` ayrı satırlarda kullanılır.
 */
export function formatKaporaIbanLineForReceipt(
  branding: BrandingDepositFields | null | undefined
): string {
  const b = branding ?? DEFAULT_BRANDING;
  return `${formatKaporaTlForReceipt(b)} — ${formatIbanForDisplay(b.iban)}`;
}

export function buildReceiptReminders(
  branding: BrandingDepositFields | null | undefined,
  options?: BuildReceiptRemindersOptions
): ReceiptReminderItem[] {
  const includeKaporaIban = options?.includeKaporaIbanReminder !== false;
  const includeKaporaDeadline =
    options?.includeKaporaPaymentDeadlineReminder !== false;
  const b = branding ?? DEFAULT_BRANDING;
  const depositFormatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(b.deposit_amount);
  const monthName = getFullPaymentMonthName(b.full_payment_deadline_month);
  const calendarYear =
    b.active_sacrifice_year != null && !Number.isNaN(Number(b.active_sacrifice_year))
      ? Number(b.active_sacrifice_year)
      : new Date().getFullYear();
  const weekdayName = getFullPaymentWeekdayName(
    calendarYear,
    b.full_payment_deadline_month,
    b.full_payment_deadline_day
  );

  const reminders: ReceiptReminderItem[] = [];

  if (includeKaporaDeadline) {
    reminders.push({
      src: "info.svg",
      header: "Kapora Ödeme Süresi",
      description: `${b.deposit_deadline_days} gün içerisinde kaporası<br/>ödenmeyen hisseler iptal edilir.`,
    });
  }

  if (includeKaporaIban) {
    let ibanText = formatIbanForDisplay(b.iban);
    const holder = getIbanAccountHolderDisplay(b);
    if (holder) {
      ibanText += `<br/>${IBAN_ACCOUNT_HOLDER_FIELD_LABEL}: ${holder}`;
    }
    reminders.push({
      src: "wallet-fill.svg",
      header: `Kapora IBAN Bilgisi (${depositFormatted} TL)`,
      description: ibanText,
    });
  }

  reminders.push({
    src: "exclamation.svg",
    header: "Tüm Ödemeler",
    description:
      weekdayName !== ""
        ? `Tüm ödemeler ${b.full_payment_deadline_day} ${monthName} ${weekdayName}<br/>gününe kadar tamamlanmalıdır.`
        : `Tüm ödemeler ${b.full_payment_deadline_day} ${monthName}<br/>gününe kadar tamamlanmalıdır.`,
  });

  return reminders;
}
