import { parseDepositTlFromShareholderNotes } from "@/lib/receipt-reminders";
import type { shareholderSchema } from "@/types";

export type OdemelerPaymentStatusKey = "completed" | "partial" | "deposit";

/**
 * Ödemeler tablosu / filtre — PDF kapora mantığı ile uyumlu (not + tenant `deposit_amount`).
 * Canlı baskülde toplam henüz 0 olsa bile `paid >= kapora` → partial (Tüm Ödeme Bekleniyor).
 */
export function getOdemelerPaymentStatus(
  row: Pick<shareholderSchema, "paid_amount" | "total_amount" | "notes">,
  tenantDepositTl: number
): OdemelerPaymentStatusKey {
  const paid = Number(row.paid_amount ?? 0);
  const total = Number(row.total_amount ?? 0);
  const depositTl =
    parseDepositTlFromShareholderNotes(row.notes ?? null) ?? tenantDepositTl;

  if (total > 0 && paid >= total) {
    return "completed";
  }
  if (depositTl > 0) {
    return paid >= depositTl ? "partial" : "deposit";
  }
  return "partial";
}

/** Sıralama: Tamamlandı > Tüm ödeme > Kapora */
export function getOdemelerPaymentStatusSortValue(
  row: Pick<shareholderSchema, "paid_amount" | "total_amount" | "notes">,
  tenantDepositTl: number
): number {
  const s = getOdemelerPaymentStatus(row, tenantDepositTl);
  if (s === "completed") return 2;
  if (s === "partial") return 1;
  return 0;
}
