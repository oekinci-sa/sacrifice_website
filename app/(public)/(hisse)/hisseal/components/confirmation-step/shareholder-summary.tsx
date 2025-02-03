"use client"

import { Button } from "@/components/ui/button"
import { sacrificeSchema } from "@/types"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useState } from "react"
import PhoneVerificationDialog from "./phone-verification-dialog"
import { useCreateShareholders } from "@/hooks/useShareholders"
import { useRouter } from "next/navigation"

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
  
  // Baştaki 0'ı kaldır
  const withoutZero = withoutPrefix.replace(/^0/, '')
  
  // +90 ile başlayan formata çevir
  return "+90" + withoutZero
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

const getGridClass = (shareholderCount: number) => {
  switch (shareholderCount) {
    case 1:
      return "grid grid-cols-1 [&>*]:w-1/2 [&>*]:mx-auto" // Tek kart, yarı genişlikte ve ortada
    case 2:
      return "grid grid-cols-2 gap-12 [&>*]:w-full" // İki kart, tam genişlikte yan yana
    case 3:
      return "grid grid-cols-2 gap-12 [&>*]:w-full [&>*:last-child]:col-span-2 [&>*:last-child]:w-1/2 [&>*:last-child]:mx-auto" // Son kart ortada ve yarı genişlikte
    case 4:
      return "grid grid-cols-2 gap-12 [&>*]:w-full" // İkişerli iki satır, tam genişlikte
    case 5:
      return "grid grid-cols-2 gap-12 [&>*]:w-full [&>*:last-child]:col-span-2 [&>*:last-child]:w-1/2 [&>*:last-child]:mx-auto" // Son kart ortada ve yarı genişlikte
    case 6:
      return "grid grid-cols-2 gap-12 [&>*]:w-full" // İkişerli üç satır, tam genişlikte
    case 7:
      return "grid grid-cols-2 gap-12 [&>*]:w-full [&>*:last-child]:col-span-2 [&>*:last-child]:w-1/2 [&>*:last-child]:mx-auto" // Son kart ortada ve yarı genişlikte
    default:
      return "grid grid-cols-2 gap-12 [&>*]:w-full" // Varsayılan olarak tam genişlikte
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
  onApprove,
  setCurrentStep,
  remainingTime,
  setRemainingTime,
}: ShareholderSummaryProps) {
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const createShareholders = useCreateShareholders()
  const router = useRouter()

  const handleVerificationComplete = async (phone: string) => {
    console.log("Doğrulama dialogundan gelen numara:", phone)
    const formattedPhone = formatPhoneNumber(phone)
    console.log("Formatlanmış numara:", formattedPhone)
    
    const matchingShareholder = shareholders.find(shareholder => {
      const shareholderFormattedPhone = formatPhoneNumber(shareholder.phone)
      console.log('Hissedar numarası:', shareholderFormattedPhone)
      
      return shareholderFormattedPhone === formattedPhone
    })

    if (!matchingShareholder) {
      console.error("Eşleşen hissedar bulunamadı")
      return
    }

    try {
      // Hissedar verilerini hazırla
      const shareholderDataArray = shareholders.map(shareholder => ({
        shareholder_name: shareholder.name,
        phone_number: formatPhoneNumber(shareholder.phone),
        delivery_location: shareholder.delivery_location,
        delivery_fee: shareholder.delivery_location !== "kesimhane" ? 500 : 0,
        share_price: sacrifice?.share_price || 0,
        total_amount: (sacrifice?.share_price || 0) + (shareholder.delivery_location !== "kesimhane" ? 500 : 0),
        sacrifice_consent: false,
        last_edited_by: matchingShareholder.name,
        purchased_by: matchingShareholder.name,
        sacrifice_id: sacrifice?.sacrifice_id || "",
        paid_amount: 0,
        remaining_payment: (sacrifice?.share_price || 0) + (shareholder.delivery_location !== "kesimhane" ? 500 : 0),
      }))

      // Verileri DB'ye kaydet
      await createShareholders.mutateAsync(shareholderDataArray)
    } catch (error) {
      console.error("Hissedarlar kaydedilirken hata oluştu:", error)
    }
  }

  return (
    <div className="space-y-8">
      <div className={getGridClass(shareholders.length)}>
        {shareholders.map((shareholder, index) => (
          <div
            key={index}
            className="bg-[#fcfcfa] rounded-lg border border-dashed border-[#c7ddcd] p-6"
          >
            <h3 className="text-lg font-semibold text-center mb-6">
              {index + 1}. Hissedar Bilgileri
            </h3>

            <div className="grid grid-cols-2 gap-8">
              {/* Sol Sütun */}
              <div className="space-y-4">
                <div>
                  <span className="text-[#5b725e] block">Ad Soyad</span>
                  <span className="text-black text-lg">{shareholder.name}</span>
                </div>
                <div>
                  <span className="text-[#5b725e] block">Teslimat Tercihi</span>
                  <span className="text-black text-lg">
                    {getDeliveryLocationText(shareholder.delivery_location)}
                  </span>
                </div>
              </div>

              {/* Sağ Sütun */}
              <div>
                <span className="text-[#5b725e] block">Telefon</span>
                <span className="text-black text-lg">{formatPhoneNumber(shareholder.phone)}</span>
              </div>
            </div>

            <div className="my-6 border-t border-dashed border-[#c7ddcd]" />

            {/* Alt Bilgiler */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <span className="text-[#5b725e] block">Kurbanlık No</span>
                  <span className="text-black text-lg">{sacrifice?.sacrifice_no}</span>
                </div>
                <div>
                  <span className="text-[#5b725e] block">Hisse Bedeli</span>
                  <span className="text-black text-lg">{sacrifice?.share_price} ₺</span>
                </div>
              </div>

              <div>
                <span className="text-[#5b725e] block">Kesim Saati</span>
                <span className="text-black text-lg">
                  {formatSacrificeTime(sacrifice?.sacrifice_time || null)}
                </span>
              </div>
            </div>

            <div className="my-6 border-t border-dashed border-[#c7ddcd]" />

            <div className="flex justify-between items-center">
              <span className="text-[#5b725e]">Toplam Ücret</span>
              <span className="text-black text-lg font-medium">
                {shareholder.delivery_location !== "kesimhane"
                  ? (sacrifice?.share_price || 0) + 500
                  : sacrifice?.share_price} ₺
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center gap-4 pt-6">
        <div className="flex items-center gap-2">
          <span className="text-lg">Hissedar Bilgileri</span>
          <Button
            variant="ghost"
            className="bg-[#FCEFEF] hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 flex items-center justify-center h-10 w-10 rounded-full"
            onClick={() => setCurrentStep("details")}
          >
            <ArrowLeft className="h-12 w-12" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300 flex items-center justify-center h-10 w-10 rounded-full"
            onClick={() => setShowVerificationDialog(true)}
          >
            <ArrowRight className="h-12 w-12" />
          </Button>
          <span className="text-lg">Hisseleri Onayla</span>
        </div>
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
