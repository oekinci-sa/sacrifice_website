"use client";

import { useTenantBranding } from "@/hooks/useTenantBranding";
import { getDeliverySelectionFromLocation, getDeliveryTypeDisplayLabel, showPlannedTeslimSaatiOnPublicPages } from "@/lib/delivery-options";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { addDays } from "date-fns";
import Image from "next/image";
import { ProgressBar } from "./ProgressBar";

interface ShareholderDetailsProps {
  shareholderInfo: shareholderSchema & {
    sacrifice?: {
      sacrifice_id: string;
      sacrifice_no: string;
      sacrifice_time?: string;
      planned_delivery_time?: string | null;
      share_price?: number;
      share_weight?: string | number;
    };
  };
}

export function ShareholderDetails({ shareholderInfo }: ShareholderDetailsProps) {
  const branding = useTenantBranding();

  const lastDepositDate = addDays(new Date(shareholderInfo.purchase_time), branding.deposit_deadline_days);

  // Format sacrifice time (remove seconds)
  const formatSacrificeTime = (timeString: string | null | undefined) => {
    if (!timeString) return "-";

    try {
      // If there are seconds (format: HH:MM:SS), remove them
      if (timeString.split(':').length > 2) {
        const parts = timeString.split(':');
        return `${parts[0]}:${parts[1]}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const deliveryFee = Number(shareholderInfo.delivery_fee ?? 0);
  const labelClass = "text-sac-muted font-medium block text-[16px] md:text-lg";
  const valueClass = "text-black font-medium text-[16px] md:text-lg";
  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + " TL";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,240px)_1fr] gap-6 lg:gap-10 border border-sac-border-light rounded-lg p-4 md:p-6 lg:p-8 mx-auto max-w-4xl mb-4 bg-sac-form-bg">
      {/* Sol Bölüm - Kişisel Bilgiler */}
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shrink-0">
            <Image src="/icons/user2.svg" alt="User" width={28} height={28} className="w-7 h-7 md:w-8 md:h-8" />
          </div>
          <h2 className="text-lg md:text-xl font-semibold mt-2 break-words">{shareholderInfo.shareholder_name}</h2>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div>
            <p className={labelClass}>Telefon</p>
            <p className={valueClass}>{formatPhoneForDisplayWithSpacing(shareholderInfo.phone_number ?? "")}</p>
          </div>
          <div>
            <p className={labelClass}>Teslimat Tercihi</p>
            <p className={valueClass}>
              {getDeliveryTypeDisplayLabel(
                branding.logo_slug,
                getDeliverySelectionFromLocation(branding.logo_slug, shareholderInfo.delivery_location ?? ""),
                null,
                false
              )}
            </p>
          </div>
          <div>
            <p className={labelClass}>Teslimat Yeri</p>
            <p className={valueClass}>
              {shareholderInfo.delivery_location && shareholderInfo.delivery_location !== "-"
                ? shareholderInfo.delivery_location
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Sağ Bölüm - Kurbanlık ve Ödeme */}
      <div className="flex flex-col gap-6 md:gap-8 min-w-0">
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Kurbanlık Bilgileri</h3>
          <div className="my-3 md:my-4 border-t border-dashed border-sac-border-light" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            <div className="space-y-2 md:space-y-4">
              <div>
                <p className={labelClass}>Kurbanlık No</p>
                <p className={valueClass}>{shareholderInfo.sacrifice?.sacrifice_no}</p>
              </div>
              <div>
                <p className={labelClass}>Hisse Bedeli</p>
                <p className={valueClass}>{fmt(Number(shareholderInfo.sacrifice?.share_price ?? 0))}</p>
              </div>
            </div>
            <div className="space-y-2 md:space-y-4">
              <div>
                <p className={labelClass}>Kesim Saati</p>
                <p className={valueClass}>{formatSacrificeTime(shareholderInfo.sacrifice?.sacrifice_time)}</p>
              </div>
              {showPlannedTeslimSaatiOnPublicPages(branding.logo_slug) && (
                <div>
                  <p className={labelClass}>Teslim Saati</p>
                  <p className={valueClass}>{formatSacrificeTime(shareholderInfo.sacrifice?.planned_delivery_time)}</p>
                </div>
              )}
              <div>
                <p className={labelClass}>Kilogram</p>
                <p className={valueClass}>
                  {shareholderInfo.sacrifice?.share_weight
                    ? `${shareholderInfo.sacrifice.share_weight} ±3 kg`
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Ödeme Detayları</h3>
          <div className="my-3 md:my-4 border-t border-dashed border-sac-border-light" />

          <div className="space-y-3 md:space-y-4">
            <div>
              <p className={labelClass}>Son kapora ödeme tarihi</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className={valueClass}>{lastDepositDate.toLocaleDateString("tr-TR")}</p>
                {shareholderInfo.paid_amount >= branding.deposit_amount && (
                  <span className="text-[16px] md:text-lg text-sac-primary">• Ödeme yapıldı</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div>
                <p className={labelClass}>Teslimat Ücreti</p>
                <p className={valueClass}>{fmt(deliveryFee)}</p>
              </div>
              <div>
                <p className={labelClass}>Toplam Ücret</p>
                <p className={valueClass}>{fmt(Number(shareholderInfo.total_amount))}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-6 pt-4 border-t border-dashed border-sac-border-light space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <p className={valueClass}>Ödeme Miktarı: {fmt(shareholderInfo.paid_amount)}</p>
              <p
                className={cn("font-medium text-[16px] md:text-lg", {
                  "text-sac-red": shareholderInfo.paid_amount < branding.deposit_amount,
                  "text-sac-yellow":
                    shareholderInfo.paid_amount >= branding.deposit_amount && shareholderInfo.remaining_payment > 0,
                  "text-sac-primary": shareholderInfo.remaining_payment <= 0,
                })}
              >
                {shareholderInfo.paid_amount < branding.deposit_amount
                  ? "Kapora Bekleniyor"
                  : shareholderInfo.remaining_payment > 0
                    ? "Tüm Ödeme Bekleniyor"
                    : "Ödeme Tamamlandı"}
              </p>
            </div>
            <ProgressBar
              paidAmount={shareholderInfo.paid_amount}
              totalAmount={shareholderInfo.total_amount}
              depositAmount={branding.deposit_amount}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 