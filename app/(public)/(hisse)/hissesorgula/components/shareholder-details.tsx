"use client";

import { Separator } from "@/components/ui/separator";
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
      share_price?: number;
      share_weight?: string | number;
    };
  };
}

export function ShareholderDetails({ shareholderInfo }: ShareholderDetailsProps) {

  // Son kapora ödeme tarihi (kayıt tarihinden 3 gün sonra)
  const lastDepositDate = addDays(new Date(shareholderInfo.purchase_time), 3);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-[192px_1fr] gap-12 border border-gray-200 rounded-lg p-4 md:p-8 mx-auto md:w-2/3 mb-4">
      {/* Sol Bölüm - Kişisel Bilgiler */}
      <div className="space-y-6 md:space-y-8">
        {/* Resim + İsim */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 md:w-20 h-16 md:h-20 flex items-center justify-center">
            <Image
              src="/icons/user2.svg"
              alt="User"
              width={32}
              height={32}
              className="md:w-10 md:h-10"
            />
          </div>
          <h2 className="text-xl md:text-2xl font-semibold">{shareholderInfo.shareholder_name}</h2>
        </div>

        {/* Telefon + Teslimat Tercihi */}
        <div className="flex flex-row md:flex-col justify-between gap-4 md:gap-12">
          <div className="space-y-1 text-center">
            <p className="text-xs md:text-lg text-slate-600">Telefon</p>
            <p className="font-medium text-sm md:text-lg">{formatPhoneForDisplayWithSpacing(shareholderInfo.phone_number)}</p>
          </div>

          <div className="space-y-1 text-center">
            <p className="text-xs md:text-lg text-slate-600">Teslimat Tercihi</p>
            <p className="font-medium text-sm md:text-lg">
              {shareholderInfo.delivery_location}
            </p>
          </div>

          <div className="space-y-1 text-center">
            <p className="text-xs md:text-lg text-slate-600">Vekalet Durumu</p>
            <p className="font-medium text-sm md:text-lg">{shareholderInfo.sacrifice_consent ? "Vekalet Alındı" : "Vekalet Alınmadı"}</p>
          </div>
        </div>
      </div>

      {/* Sağ Bölüm - Kurbanlık ve Ödeme Bilgileri */}
      <div className="space-y-12 md:space-y-12">
        {/* Kurbanlık Bilgileri */}
        <div className="space-y-4">
          <h3 className="text-base md:text-xl font-semibold">Kurbanlık Bilgileri</h3>
          <Separator className="my-2" />
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-slate-600 font-medium mb-1">Kurbanlık No</p>
                <p className="font-medium">{shareholderInfo.sacrifice?.sacrifice_no}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium mb-1">Hisse Bedeli</p>
                <p className="font-medium">
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(shareholderInfo.sacrifice?.share_price || 0)}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-slate-600 font-medium mb-1">Kesim Saati</p>
                <p className="font-medium">
                  {formatSacrificeTime(shareholderInfo.sacrifice?.sacrifice_time)}
                </p>
              </div>
              <div>
                <p className="text-slate-600 font-medium mb-1">Kilogram</p>
                <p className="font-medium">
                  {shareholderInfo.sacrifice?.share_weight
                    ? `${shareholderInfo.sacrifice.share_weight} ±3 kg`
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ödeme Detayları */}
        <div className="space-y-4">
          <div className="flex flex-row justify-between items-start md:items-center gap-4 md:gap-0">
            <h3 className="text-base md:text-xl font-semibold">Ödeme Detayları</h3>
            {/* <Button
              className="w-auto bg-[#f8f8f8] text-black text-sm md:text-base hover:bg-[#e8e8e8] hover:text-black border-[#39C645]"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 mr-0 md:mr-2" />
              PDF İndir
            </Button> */}
          </div>
          <Separator className="my-2" />

          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <p className="text-slate-600 font-medium mb-1">Son kapora ödeme tarihi</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm md:text-base">{lastDepositDate.toLocaleDateString("tr-TR")}</p>
                {shareholderInfo.paid_amount >= 5000 && (
                  <span className="text-sm md:text-base text-[#39C645]">• Ödeme yapıldı</span>
                )}
              </div>
            </div>
            <div className="text-right space-y-1 mb-4">
              <p className="text-muted-foreground">Toplam Ücret</p>
              <p className="font-medium text-sm md:text-base">
                {new Intl.NumberFormat("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(shareholderInfo.total_amount)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <p className="font-medium text-sm md:text-base">
                Ödeme Miktarı: {new Intl.NumberFormat("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(shareholderInfo.paid_amount)}
              </p>
              <p className={cn(
                "font-medium",
                {
                  "text-[#D22D2D]": shareholderInfo.paid_amount < 5000,
                  "text-[#F9BC06]": shareholderInfo.paid_amount >= 5000 && shareholderInfo.remaining_payment > 0,
                  "text-[#39C645]": shareholderInfo.remaining_payment <= 0,
                }
              )}>
                {shareholderInfo.paid_amount < 5000
                  ? "Kapora Bekleniyor"
                  : shareholderInfo.remaining_payment > 0
                    ? "Tüm Ödeme Bekleniyor"
                    : "Ödeme Tamamlandı"}
              </p>
            </div>
            <ProgressBar
              paidAmount={shareholderInfo.paid_amount}
              totalAmount={shareholderInfo.total_amount}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 