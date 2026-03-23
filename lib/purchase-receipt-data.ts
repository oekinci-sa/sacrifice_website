/**
 * Teşekkür sayfası PDF'i (ReceiptPDF) ile aynı alanları üretir — e-posta içeriği senkronu için.
 */

import { formatDate } from "@/lib/date-utils";
import {
  getDeliveryFeeForLocation,
  getDeliverySelectionFromLocation,
} from "@/lib/delivery-options";
import type { TenantBranding } from "@/lib/tenant-branding";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";

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
}

function formatSacrificeTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.split(":").slice(0, 2).join(":");
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
  },
  sacrifice: {
    sacrifice_no?: unknown;
    sacrifice_time?: string | null;
    share_price?: number | null;
    share_weight?: string | null;
  },
  reservation: { created_at?: string | null },
  transactionId: string,
  branding: TenantBranding
): PurchaseReceiptPdfLikeData {
  const logoSlug = branding.logo_slug;
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

  return {
    shareholder_name: shareholder.shareholder_name?.trim() || "Müşteri",
    phone_number: phone,
    second_phone_number: second,
    email: shareholder.email?.trim() || undefined,
    delivery_type: deliveryType,
    delivery_location: deliveryLocationDisplay,
    vekalet_durumu: shareholder.proxy_status || "Belirtilmemiş",
    share_price: sharePrice.toString(),
    delivery_fee: deliveryFee.toString(),
    total_amount: totalAmount.toString(),
    paid_amount: paidAmount.toString(),
    remaining_payment: remainingPayment.toString(),
    purchase_time: reservation.created_at
      ? formatDate(reservation.created_at)
      : formatDate(new Date()),
    sacrifice_consent: !!shareholder.sacrifice_consent,
    sacrifice_no: sacrifice.sacrifice_no != null ? String(sacrifice.sacrifice_no) : "",
    sacrifice_time: formatSacrificeTime(sacrifice.sacrifice_time ?? undefined),
    share_weight: sacrifice.share_weight != null ? String(sacrifice.share_weight) : "",
    transaction_id: transactionId,
    security_code: shareholder.security_code?.trim() || "------",
  };
}
