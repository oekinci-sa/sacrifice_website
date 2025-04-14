"use client";

import { Download } from"lucide-react";
import { cn } from"@/lib/utils";
import { formatPhoneForDisplay } from"@/utils/formatters";
import { Button } from"@/components/ui/button";
import { Separator } from"@/components/ui/separator";
import { ProgressBar } from"./ProgressBar";
import { addDays, format } from"date-fns";
import Image from"next/image";
import { shareholderSchema } from"@/types";

interface ShareholderDetailsProps {
  shareholderInfo: shareholderSchema;
}

const getDeliveryLocationText = (location: string) => {
  switch (location) {
    case"kesimhane":
      return"Kesimhanede Teslim";
    case"yenimahalle-pazar-yeri":
      return"Yenimahalle Pazar Yeri";
    case"kecioren-otoparki":
      return"Keçiören Otoparkı";
    default:
      return location;
  }
};

export function ShareholderDetails({ shareholderInfo }: ShareholderDetailsProps) {
  const handleDownloadPDF = () => {
    // PDF indirme işlemi burada yapılacak
    console.log("PDF indiriliyor...");
  };

  // Son kapora ödeme tarihi (kayıt tarihinden 3 gün sonra)
  const lastDepositDate = addDays(new Date(shareholderInfo.purchase_time), 3);

  const formatSacrificeTime = (timeString: string | null | undefined) => {
    if (!timeString) return"Henüz belirlenmedi";
    try {
      return format(new Date(timeString), 'HH:mm');
    } catch {
      return"Henüz belirlenmedi";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 md:space-x-12 w-full p-8 gap-8 md:p-12 border border-gray-200 rounded-lg">
      {/* Sol Bölüm - Kişisel Bilgiler */}
      <div className="space-y-6 md:space-y-8">
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
        
        <div className="space-y-8 md:space-y-12">
          <div className="space-y-1 text-center">
            <p className="text-slate-600">Telefon</p>
            <p className="font-medium text-sm md:text-base">{formatPhoneForDisplay(shareholderInfo.phone_number)}</p>
          </div>
          
          <div className="space-y-1 text-center">
            <p className="text-slate-600">Teslimat Tercihi</p>
            <p className="font-medium text-sm md:text-base">{getDeliveryLocationText(shareholderInfo.delivery_location)}</p>
          </div>
          
          <div className="space-y-1 text-center">
            <p className="text-slate-600">Vekalet Durumu</p>
            <p className="font-medium text-sm md:text-base">{shareholderInfo.sacrifice_consent ?"Vekalet Alındı":"Vekalet Alınmadı"}</p>
          </div>
        </div>
      </div>

      {/* Sağ Bölüm - Kurbanlık ve Ödeme Bilgileri */}
      <div className="col-span-1 md:col-span-5 space-y-8 md:space-y-12">
        {/* Kurbanlık Bilgileri */}
        <div className="space-y-4">
          <h3 className="text-base md:text-xl font-semibold">Kurbanlık Bilgileri</h3>
          <Separator className="my-2"/>
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
                    style:"currency",
                    currency:"TRY",
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
                <p className="font-medium">26 ±3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ödeme Detayları */}
        <div className="space-y-4">
          <div className="flex flex-row justify-between items-start md:items-center gap-4 md:gap-0">
            <h3 className="text-base md:text-xl font-semibold">Ödeme Detayları</h3>
            <Button
              className="w-auto bg-[#f8f8f8] text-black text-sm md:text-base hover:bg-[#e8e8e8] hover:text-black border-[#39C645]"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 mr-0 md:mr-2"/>
              PDF İndir
            </Button>
          </div>
          <Separator className="my-2"/>
          
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <p className="text-slate-600 font-medium mb-1">Son kapora ödeme tarihi</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm md:text-base">{lastDepositDate.toLocaleDateString("tr-TR")}</p>
                {shareholderInfo.paid_amount >= 2000 && (
                  <span className="text-sm md:text-base text-[#39C645]">• Ödeme yapıldı</span>
                )}
              </div>
            </div>
            <div className="text-right space-y-1 mb-4">
              <p className="text-muted-foreground">Toplam Ücret</p>
              <p className="font-medium text-sm md:text-base">
                {new Intl.NumberFormat("tr-TR", {
                  style:"currency",
                  currency:"TRY",
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
                  style:"currency",
                  currency:"TRY",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(shareholderInfo.paid_amount)}
              </p>
              <p className={cn(
               "font-medium",
                {
                 "text-[#D22D2D]": shareholderInfo.paid_amount < 2000,
                 "text-[#F9BC06]": shareholderInfo.paid_amount >= 2000 && shareholderInfo.remaining_payment > 0,
                 "text-[#39C645]": shareholderInfo.remaining_payment <= 0,
                }
              )}>
                {shareholderInfo.paid_amount < 2000
                  ?"Kapora Bekleniyor"
                  : shareholderInfo.remaining_payment > 0
                  ?"Tüm Ödeme Bekleniyor"
                  :"Ödeme Tamamlandı"}
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