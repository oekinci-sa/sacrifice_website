"use client";

import { cn } from "@/lib/utils";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { sacrificeSchema } from "@/types";
import { formatSacrificeTime } from "./formatSacrificeTime";

interface ShareholderSummaryCardProps {
  shareholder: {
    name: string;
    phone: string;
    email?: string;
    delivery_location: string;
    is_purchaser?: boolean;
    paid_amount?: number;
  };
  sacrifice: sacrificeSchema | null;
  index: number;
  isPurchaser: boolean;
  totalShareholders: number;
}

export function ShareholderSummaryCard({
  shareholder,
  sacrifice,
  index,
  isPurchaser,
  totalShareholders,
}: ShareholderSummaryCardProps) {
  return (
    <div
      className={cn(
        "bg-sac-form-bg rounded-lg border border-dashed",
        isPurchaser ? "border-sac-border-blue" : "border-sac-border-light",
        "p-4 md:p-6 w-full relative",
        totalShareholders === 1 ? "md:col-span-2 md:w-1/2 md:mx-auto" : "",
        totalShareholders % 2 === 1 && index === totalShareholders - 1
          ? "md:col-span-2 md:w-1/2 md:mx-auto"
          : ""
      )}
    >
      {isPurchaser && totalShareholders > 1 && (
        <div className="absolute -top-3 right-4 bg-primary text-white text-xs md:text-base py-1 px-2 rounded-full">
          İşlemi Gerçekleştiren Kişi
        </div>
      )}

      <h3 className="text-lg md:text-xl font-semibold text-center mt-2 md:mt-0 mb-4 md:mb-6">
        {index + 1}. Hissedar Bilgileri
      </h3>

      <div className="grid grid-cols-2 gap-4 md:gap-8">
        <div className="space-y-3 md:space-y-4">
          <div>
            <span className="text-sac-muted font-medium block text-[16px] md:text-lg">
              Ad Soyad
            </span>
            <span className="text-black font-medium text-[16px] md:text-lg">
              {shareholder.name}
            </span>
          </div>
          {shareholder.email && (
            <div>
              <span className="text-sac-muted font-medium block text-[16px] md:text-lg">
                E-posta
              </span>
              <span className="text-black font-medium text-[16px] md:text-lg">
                {shareholder.email}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 md:space-y-4">
          <div>
            <span className="text-sac-muted font-medium block text-[16px] md:text-lg">
              Telefon
            </span>
            <span className="text-black font-medium text-[16px] md:text-lg">
              {formatPhoneForDisplayWithSpacing(shareholder.phone)}
            </span>
          </div>
          <div>
            <span className="text-sac-muted font-medium block text-[16px] md:text-lg">
              Teslimat Tercihi
            </span>
            <span className="text-black font-medium text-[16px] md:text-lg">
              {shareholder.delivery_location}
            </span>
          </div>
        </div>
      </div>

      <div className="my-4 md:my-6 border-t border-dashed border-sac-border-light" />

      <div className="grid grid-cols-2 gap-2 md:gap-8">
        <div className="space-y-2 md:space-y-4">
          <div>
            <span className="text-sac-muted font-medium block text-[16px] md:text-lg">
              Kurbanlık No
            </span>
            <span className="text-black font-medium text-[16px] md:text-lg">
              {sacrifice?.sacrifice_no}
            </span>
          </div>
          <div>
            <span className="text-sac-muted font-medium block text-[16px] md:text-lg">
              Hisse Bedeli
            </span>
            <span className="text-black font-medium text-[16px] md:text-lg">
              {sacrifice?.share_price} TL
            </span>
          </div>
        </div>

        <div className="space-y-2 md:space-y-4">
          <div>
            <span className="text-sac-muted font-medium block text-[16px] md:text-lg">
              Kesim Saati
            </span>
            <span className="text-black font-medium text-[16px] md:text-lg">
              {formatSacrificeTime(sacrifice?.sacrifice_time || null)}
            </span>
          </div>
        </div>
      </div>

      <div className="my-3 md:my-6 border-t border-dashed border-sac-border-light" />

      <div className="grid grid-cols-2 gap-2 md:gap-8">
        <span className="col-span-1 text-sac-muted font-medium text-[16px] md:text-lg">
          Toplam Ücret
        </span>
        <span className="col-span-1 text-black font-medium text-[16px] md:text-lg">
          {new Intl.NumberFormat("tr-TR").format(
            shareholder.delivery_location !== "Kesimhane"
              ? (sacrifice?.share_price || 0) + 750
              : sacrifice?.share_price || 0
          )}{" "}
          TL
        </span>
      </div>
    </div>
  );
}
