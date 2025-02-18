"use client"

import { Button } from "@/components/ui/button"
import { sacrificeSchema } from "@/types"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useState } from "react"
import PhoneVerificationDialog from "./phone-verification-dialog"
import { useCreateShareholders } from "@/hooks/useShareholders"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type Step = "selection" | "details" | "confirmation"

interface ShareholderSummaryProps {
  sacrifice: sacrificeSchema | null
  shareholders: {
    name: string
    phone: string
    delivery_location: string
  }[]
  onApprove: () => void
  setCurrentStep: (step: Step) => void
  remainingTime: number
  setRemainingTime: (value: number | ((prevValue: number) => number)) => void
}

const formatPhoneNumber = (phone: string) => {
  // Önce tüm non-digit karakterleri kaldır
  const cleaned = phone.replace(/\D/g, '')
  
  // Eğer +90 ile başlıyorsa, onu kaldır
  const withoutPrefix = cleaned.replace(/^90/, '')
  
  // Baştaki 0'ı kaldır ve tekrar ekle
  const withoutZero = withoutPrefix.replace(/^0/, '')
  const withZero = '0' + withoutZero
  
  // Formatı ayarla: 05XX XXX XX XX
  const formatted = withZero.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4')
  return formatted
}

const getDeliveryLocationText = (location: string) => {
  switch (location) {
    case "kesimhane":
      return "Kesimhanede Teslim"
    case "yenimahalle-pazar-yeri":
      return "Yenimahalle Pazar Yeri (+500₺)"
    case "kecioren-otoparki":
      return "Keçiören Otoparkı (+500₺)"
    default:
      return location
  }
}


const formatSacrificeTime = (timeString: string | null) => {
  if (!timeString) return '-';
  try {
    // ISO string'e çeviriyoruz
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      // Eğer geçerli bir tarih değilse, direkt string'i parse edelim
      const [hours, minutes] = timeString.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Tarih formatlanırken hata oluştu:', error);
    return timeString; // Hata durumunda orijinal string'i gösterelim
  }
}

export default function ShareholderSummary({
  sacrifice,
  shareholders,
  setCurrentStep,
}: ShareholderSummaryProps) {
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const createShareholders = useCreateShareholders()
  const { toast } = useToast()

  const handleVerificationComplete = async (phone: string, verifiedShareholderName: string) => {
    console.log("Doğrulama dialogundan gelen numara:", phone)
    
    const matchingShareholder = shareholders.find(shareholder => {
      // Telefon numaralarını aynı formata getirip karşılaştır
      const shareholderPhone = shareholder.phone.replace(/\D/g, '')
        .replace(/^0/, '') // Baştaki 0'ı kaldır
      const verificationPhone = phone.replace(/\D/g, '')
        .replace(/^\+/, '') // Baştaki + işaretini kaldır
        .replace(/^90/, '') // Baştaki 90'ı kaldır
      
      return shareholderPhone === verificationPhone
    })

    if (!matchingShareholder) {
      console.error("Eşleşen hissedar bulunamadı")
      return
    }

    try {
      // Hissedar verilerini hazırla
      const shareholderDataArray = shareholders.map(shareholder => {
        // Telefon numarasını DB formatına çevir
        const cleanedPhone = shareholder.phone.replace(/\D/g, '')
          .replace(/^0/, '') // Baştaki 0'ı kaldır
        const formattedPhone = cleanedPhone.startsWith('90') 
          ? '+' + cleanedPhone 
          : '+90' + cleanedPhone

        return {
          shareholder_name: shareholder.name,
          phone_number: formattedPhone,
          delivery_location: shareholder.delivery_location,
          delivery_fee: shareholder.delivery_location !== "kesimhane" ? 500 : 0,
          share_price: sacrifice?.share_price || 0,
          total_amount: (sacrifice?.share_price || 0) + (shareholder.delivery_location !== "kesimhane" ? 500 : 0),
          sacrifice_consent: false,
          last_edited_by: verifiedShareholderName,
          purchased_by: verifiedShareholderName,
          sacrifice_id: sacrifice?.sacrifice_id || "",
          paid_amount: 0,
          remaining_payment: (sacrifice?.share_price || 0) + (shareholder.delivery_location !== "kesimhane" ? 500 : 0),
        }
      })

      // Verileri DB'ye kaydet
      await createShareholders.mutateAsync(shareholderDataArray)
    } catch (error) {
      console.error("Hissedarlar kaydedilirken hata oluştu:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hissedarlar kaydedilirken bir hata oluştu.",
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-12 w-full mx-auto">
        {shareholders.map((shareholder, index) => (
          <div
            key={index}
            className={cn(
              "bg-[#fcfcfa] rounded-lg border border-dashed border-[#c7ddcd] p-4 sm:p-6 w-full",
              shareholders.length === 1 ? "sm:col-span-2 sm:w-1/2 sm:mx-auto" : "",
              shareholders.length % 2 === 1 && index === shareholders.length - 1 ? "sm:col-span-2 sm:w-1/2 sm:mx-auto" : ""
            )}
          >
            <h3 className="text-sm sm:text-lg font-semibold text-center mb-4 sm:mb-6">
              {index + 1}. Hissedar Bilgileri
            </h3>

            <div className="grid grid-cols-2 gap-4 sm:gap-8">
              {/* Sol Sütun */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <span className="text-[#5b725e] block text-xs sm:text-base">Ad Soyad</span>
                  <span className="text-black text-sm sm:text-lg">{shareholder.name}</span>
                </div>
                <div>
                  <span className="text-[#5b725e] block text-xs sm:text-base">Teslimat Tercihi</span>
                  <span className="text-black text-sm sm:text-lg">
                    {getDeliveryLocationText(shareholder.delivery_location)}
                  </span>
                </div>
              </div>

              {/* Sağ Sütun */}
              <div>
                <span className="text-[#5b725e] block text-xs sm:text-base">Telefon</span>
                <span className="text-black text-sm sm:text-lg">{formatPhoneNumber(shareholder.phone)}</span>
              </div>
            </div>

            <div className="my-4 sm:my-6 border-t border-dashed border-[#c7ddcd]" />

            {/* Alt Bilgiler */}
            <div className="grid grid-cols-2 gap-2 sm:gap-8">
              <div className="space-y-2 sm:space-y-4">
                <div>
                  <span className="text-[#5b725e] block text-[10px] sm:text-base">Kurbanlık No</span>
                  <span className="text-black text-xs sm:text-lg">{sacrifice?.sacrifice_no}</span>
                </div>
                <div>
                  <span className="text-[#5b725e] block text-[10px] sm:text-base">Hisse Bedeli</span>
                  <span className="text-black text-xs sm:text-lg">{sacrifice?.share_price} TL</span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-4">
                <div>
                  <span className="text-[#5b725e] block text-[10px] sm:text-base">Kesim Saati</span>
                  <span className="text-black text-xs sm:text-lg">
                    {formatSacrificeTime(sacrifice?.sacrifice_time || null)}
                  </span>
                </div>
              </div>
            </div>

            <div className="my-3 sm:my-6 border-t border-dashed border-[#c7ddcd]" />

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <span className="text-[#5b725e] text-[10px] sm:text-base">Toplam Ücret</span>
              <span className="text-black text-xs sm:text-lg font-medium text-right">
                {new Intl.NumberFormat('tr-TR').format(
                  shareholder.delivery_location !== "kesimhane"
                    ? (sacrifice?.share_price || 0) + 500
                    : (sacrifice?.share_price || 0)
                )} TL
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center gap-4 w-full max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="bg-[#FCEFEF] hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 flex items-center justify-center h-8 sm:h-10 px-3 sm:px-4 flex-1 rounded-full"
          onClick={() => setCurrentStep("details")}
        >
          <ArrowLeft className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-2" />
          <span className="text-xs sm:text-base">Hissedar Bilgileri</span>
        </Button>

        <Button
          variant="ghost"
          className="bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300 flex items-center justify-center h-8 sm:h-10 px-3 sm:px-4 flex-1 rounded-full"
          onClick={() => setShowVerificationDialog(true)}
        >
          <span className="text-xs sm:text-base">Hisseleri Onayla</span>
          <ArrowRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 ml-0.5 sm:ml-2" />
        </Button>
      </div>

      <PhoneVerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        onVerificationComplete={handleVerificationComplete}
        shareholders={shareholders}
      />
    </div>
  )
} 
