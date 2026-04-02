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
   * @deprecated IBAN artık “Tüm Ödemeler”den sonra; bu bayrak kullanılmıyor.
   */
  includeKaporaIbanReminder?: boolean;
  /**
   * false: “Kapora Ödeme Süresi” maddesini ekleme. Varsayılan: true.
   */
  includeKaporaPaymentDeadlineReminder?: boolean;
  /** Admin PDF: kapora 0 seçildiğinde önemli notlarda “Kapora alınmayacak” vb. */
  kaporaWaived?: boolean;
  /** Ödenen tutar (TL); kapora satırında tamamlandı / bekleniyor metni için */
  paidAmountTl?: number;
  /**
   * Beklenen kapora (TL). Verilmezse `branding.deposit_amount`.
   * Admin PDF’te not/override ile `buildPurchaseReceiptData` → `effective_deposit_tl` veya `ReceiptPDF` override.
   */
  depositExpectedTl?: number;
};

/** Önemli notlar — kapora maddesi başlığı */
export const KAPORA_REMINDER_HEADER = "Kapora";
/** @deprecated `KAPORA_REMINDER_HEADER` kullanın */
export const ODENECEK_KAPORA_HEADER = KAPORA_REMINDER_HEADER;

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

/**
 * `shareholders.notes` içindeki “Bu hissedardan X TL kapora …” cümlesinden tutarı çıkarır.
 * Admin PDF not birleştirmesi ile aynı kalıba uyar (`receipt-pdf-admin-notes`).
 */
export function parseDepositTlFromShareholderNotes(
  notes: string | null | undefined
): number | null {
  if (!notes?.trim()) return null;
  const matches = Array.from(
    notes.matchAll(/hissedardan\s+([\d.,]+)\s*TL\s*kapora/gi)
  );
  if (matches.length === 0) return null;
  const raw = matches[matches.length - 1][1].replace(/\./g, "").replace(",", ".");
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
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
  const includeKaporaDeadline =
    options?.includeKaporaPaymentDeadlineReminder !== false;
  const kaporaWaived = options?.kaporaWaived === true;
  const b = branding ?? DEFAULT_BRANDING;
  const depositTl =
    options?.depositExpectedTl != null && Number.isFinite(options.depositExpectedTl)
      ? Number(options.depositExpectedTl)
      : b.deposit_amount;
  const paidTl =
    options?.paidAmountTl != null && Number.isFinite(options.paidAmountTl)
      ? Number(options.paidAmountTl)
      : 0;
  const depositFormatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(depositTl);
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
  const hasKaporaAmount = !kaporaWaived && depositTl > 0;

  if (kaporaWaived) {
    reminders.push({
      src: "info.svg",
      header: KAPORA_REMINDER_HEADER,
      description: KAPORA_WAIVED_DISPLAY,
    });
  } else if (hasKaporaAmount) {
    const kaporaStatus =
      paidTl >= depositTl ? "Kapora tamamlandı" : "Kapora bekleniyor";
    reminders.push({
      src: "info.svg",
      header: KAPORA_REMINDER_HEADER,
      description: `${depositFormatted} TL — ${kaporaStatus}`,
    });
  }

  if (includeKaporaDeadline && hasKaporaAmount && !kaporaWaived) {
    reminders.push({
      src: "info.svg",
      header: "Kapora Ödeme Süresi",
      description: `${b.deposit_deadline_days} gün içerisinde kaporası<br/>ödenmeyen hisseler iptal edilir.`,
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

  if (hasKaporaAmount && !kaporaWaived) {
    let ibanText = formatIbanForDisplay(b.iban);
    const holder = getIbanAccountHolderDisplay(b);
    if (holder) {
      ibanText += `<br/>${IBAN_ACCOUNT_HOLDER_FIELD_LABEL}: ${holder}`;
    }
    reminders.push({
      src: "wallet-fill.svg",
      header: IBAN_PAYMENT_ROW_LABEL,
      description: ibanText,
    });
  }

  return reminders;
}
