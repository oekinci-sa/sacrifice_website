/**
 * Teşekkür sayfası PDF'i (ReceiptPDF) ile aynı alanları üretir — e-posta içeriği senkronu için.
 */

import { formatDate } from "@/lib/date-utils";
import {
  getDeliveryFeeForLocation,
  getDeliverySelectionFromLocation,
} from "@/lib/delivery-options";
import {
  isLiveScaleSacrifice,
  type SacrificePricingFields,
} from "@/lib/live-scale-share";
import { parseDepositTlFromShareholderNotes } from "@/lib/receipt-reminders";
import type { TenantBranding } from "@/lib/tenant-branding";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";

/** Hisse sorgula (`shareholder-details`) ile aynı metinler — PDF / e-posta senkronu */
const MSG_LIVE_PENDING_SHARE = "Hisse bedeli henüz girilmedi.";
const MSG_LIVE_PENDING_KG = "Toplam kg henüz girilmedi.";
const MSG_LIVE_PENDING_TOTAL = "Henüz kesinleşmedi.";

/** ReceiptPDF `data` prop ile uyumlu düz alanlar */
export interface PurchaseReceiptPdfLikeData {
  shareholder_name: string;
  phone_number: string;
  second_phone_number?: string;
  email?: string;
  delivery_type: string;
  delivery_location: string;
  vekalet_durumu: string;
  share_price: string;
  delivery_fee: string;
  total_amount: string;
  paid_amount: string;
  remaining_payment: string;
  purchase_time: string;
  sacrifice_consent: boolean;
  sacrifice_no: string;
  sacrifice_time: string;
  share_weight: string;
  transaction_id: string;
  security_code: string;
  /** Notlardaki “Bu hissedardan X TL kapora” veya tenant `deposit_amount` */
  effective_deposit_tl: number;
}

/** Toplam/kalan tutarlar henüz kesin değilse (canlı baskül vb.) false — kalan tutar gösterilmez. */
export function isPurchaseReceiptTotalFinalized(
  receipt: Pick<PurchaseReceiptPdfLikeData, "total_amount" | "share_price">
): boolean {
  const sp = (receipt.share_price || "").trim();
  if (/henüz girilmedi/i.test(sp)) return false;
  const ta = (receipt.total_amount || "").trim();
  if (!ta) return false;
  if (/henüz|kesinleşmedi/i.test(ta)) return false;
  return true;
}

/**
 * “Toplam Tutar” yalnızca ek teslimat ücreti varken **ve** tutarlar kesinleştiyse gösterilir.
 * Ek ücret yoksa (toplam = hisse) veya canlı baskül / henüz kesinleşmedi ise satır yok.
 */
export function shouldShowReceiptTotalAmountRow(
  receipt: Pick<PurchaseReceiptPdfLikeData, "total_amount" | "share_price">,
  hasDeliveryFee: boolean
): boolean {
  return hasDeliveryFee && isPurchaseReceiptTotalFinalized(receipt);
}

/**
 * Geçerli rezervasyon kodu var mı — yoksa PDF/e-postada yalnızca “Rezervasyon Kodu” satırı gösterilmez;
 * “Rezervasyon Takibi ve Güvenlik” bölümü ve güvenlik kodu satırı kalır.
 */
export function hasReceiptReservationCode(
  transactionId: string | null | undefined
): boolean {
  const t = (transactionId ?? "").trim();
  if (!t) return false;
  if (/^Belirtilmemiş$/i.test(t)) return false;
  if (/^[-_.\u2022]+$/.test(t) && t.length >= 8) return false;
  return true;
}

function formatSacrificeTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.split(":").slice(0, 2).join(":");
}

/** PDF / e-posta: canlı baskül placeholder veya `X kg` için ±3 eklemeden; sabit hisse için `±3 kg` */
export function formatReceiptKilogramDisplay(shareWeight: string): string {
  const s = shareWeight.trim();
  if (!s) return "-";
  if (/henüz girilmedi/i.test(s)) return s;
  if (s.endsWith(" kg")) return s;
  return `${s} ±3 kg`;
}

export function buildPurchaseReceiptData(
  shareholder: {
    shareholder_name?: string | null;
    phone_number?: string | null;
    second_phone_number?: string | null;
    email?: string | null;
    delivery_location?: string | null;
    delivery_type?: string | null;
    paid_amount?: number | null;
    remaining_payment?: number | null;
    security_code?: string | null;
    sacrifice_consent?: boolean | null;
    proxy_status?: string | null;
    notes?: string | null;
  },
  sacrifice: {
    sacrifice_no?: unknown;
    sacrifice_time?: string | null;
    share_price?: number | null;
    share_weight?: string | null;
  } & SacrificePricingFields,
  reservation: { created_at?: string | null },
  transactionId: string,
  branding: TenantBranding
): PurchaseReceiptPdfLikeData {
  const logoSlug = branding.logo_slug;
  const livePending =
    isLiveScaleSacrifice(sacrifice) && sacrifice.live_scale_total_kg == null;

  const sharePrice = Number(sacrifice.share_price ?? 0);
  const rawDelivery = shareholder.delivery_location || "Kesimhane";
  const deliveryFee = getDeliveryFeeForLocation(logoSlug, rawDelivery);
  const totalAmount = sharePrice + deliveryFee;
  const paidAmount = Number(shareholder.paid_amount ?? 0);
  const remainingFromDb = shareholder.remaining_payment;
  const remainingPayment =
    typeof remainingFromDb === "number" && !Number.isNaN(remainingFromDb)
      ? remainingFromDb
      : totalAmount - paidAmount;

  const deliveryType =
    (shareholder.delivery_type && String(shareholder.delivery_type)) ||
    getDeliverySelectionFromLocation(logoSlug, rawDelivery || "");

  const deliveryLocationDisplay =
    rawDelivery && rawDelivery !== "-" ? rawDelivery : "-";

  const phone = formatPhoneForDisplayWithSpacing(shareholder.phone_number || "");
  const second = shareholder.second_phone_number
    ? formatPhoneForDisplayWithSpacing(shareholder.second_phone_number)
    : undefined;

  const notesDeposit = parseDepositTlFromShareholderNotes(shareholder.notes ?? null);
  const effectiveDepositTl =
    notesDeposit != null ? notesDeposit : branding.deposit_amount;

  let sharePriceDisplay: string;
  let shareWeightDisplay: string;
  let totalAmountDisplay: string;

  if (livePending) {
    sharePriceDisplay = MSG_LIVE_PENDING_SHARE;
    shareWeightDisplay = MSG_LIVE_PENDING_KG;
    totalAmountDisplay = MSG_LIVE_PENDING_TOTAL;
  } else {
    sharePriceDisplay = sharePrice.toString();
    totalAmountDisplay = totalAmount.toString();
    if (isLiveScaleSacrifice(sacrifice) && sacrifice.live_scale_total_kg != null) {
      shareWeightDisplay = `${Number(sacrifice.live_scale_total_kg)} kg`;
    } else {
      shareWeightDisplay =
        sacrifice.share_weight != null ? String(sacrifice.share_weight) : "";
    }
  }

  return {
    shareholder_name: shareholder.shareholder_name?.trim() || "Müşteri",
    phone_number: phone,
    second_phone_number: second,
    email: shareholder.email?.trim() || undefined,
    delivery_type: deliveryType,
    delivery_location: deliveryLocationDisplay,
    vekalet_durumu: shareholder.proxy_status || "Belirtilmemiş",
    share_price: sharePriceDisplay,
    delivery_fee: deliveryFee.toString(),
    total_amount: totalAmountDisplay,
    paid_amount: paidAmount.toString(),
    remaining_payment: remainingPayment.toString(),
    purchase_time: reservation.created_at
      ? formatDate(reservation.created_at)
      : formatDate(new Date()),
    sacrifice_consent: !!shareholder.sacrifice_consent,
    sacrifice_no: sacrifice.sacrifice_no != null ? String(sacrifice.sacrifice_no) : "",
    sacrifice_time: formatSacrificeTime(sacrifice.sacrifice_time ?? undefined),
    share_weight: shareWeightDisplay,
    transaction_id: transactionId,
    security_code: shareholder.security_code?.trim() || "------",
    effective_deposit_tl: effectiveDepositTl,
  };
}
