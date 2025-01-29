"use client"

import { Button } from "@/components/ui/button"
import { sacrificeSchema } from "@/types"
import SacrificeInfo from "./sacrifice-info"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"
import PhoneVerificationDialog from "./phone-verification-dialog"
import { useCreateShareholders } from "../hooks/useShareholders"

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
  // Remove all non-digits and ensure starts with 0
  const cleaned = phone.replace(/\D/g, '').replace(/^0?/, '0')
  // Format as 0XXX XXX XX XX
  return cleaned.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4')
}

const getDeliveryLocationText = (location: string) => {
  switch (location) {
    case "kesimhane":
      return "Kesimhanede Teslim"
    case "yenimahalle-pazar-yeri":
      return "Yenimahalle Pazar Yeri"
    case "kecioren-otoparki":
      return "Keçiören Otoparkı"
    default:
      return location
  }
}

const getGridClass = (shareholderCount: number) => {
  if (shareholderCount <= 2 || shareholderCount === 4) {
    return "grid-cols-2" // 2 columns for 1-2 or 4 shareholders
  }
  return "grid-cols-3" // 3 columns for 3, 5, 6, or 7 shareholders
}

const calculateTotalAmount = (sacrifice: sacrificeSchema | null, delivery_location: string) => {
  if (!sacrifice) return 0
  const deliveryFee = delivery_location !== "kesimhane" ? 500 : 0
  return sacrifice.share_price + deliveryFee
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

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev: number) => {
        if (prev <= 0) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [setRemainingTime])

  const handleVerificationComplete = async (verifiedPhone: string) => {
    // Doğrulama dialogundan gelen numarayı temizle (başındaki +9'u kaldır ve sadece rakamları al)
    const cleanVerifiedPhone = verifiedPhone.replace(/\D/g, '').replace(/^9/, '')
    
    // Debug için numaraları konsola yazdır
    console.log('Doğrulama dialogundan gelen numara:', cleanVerifiedPhone)
    
    const matchingShareholder = shareholders.find(shareholder => {
      // Hissedarın numarasını temizle (sadece rakamları al ve baştaki 0'ı kaldır)
      const cleanShareholderPhone = shareholder.phone.replace(/\D/g, '').replace(/^0/, '')
      console.log('Hissedar numarası:', cleanShareholderPhone)
      
      return cleanShareholderPhone === cleanVerifiedPhone
    })

    if (!matchingShareholder) {
      console.error("Eşleşen hissedar bulunamadı")
      return
    }

    try {
      // Hissedar verilerini hazırla
      const shareholderDataArray = shareholders.map(shareholder => ({
        shareholder_name: shareholder.name,
        phone_number: "+90" + shareholder.phone.replace(/\D/g, '').replace(/^0/, ''),
        delivery_location: shareholder.delivery_location,
        delivery_fee: shareholder.delivery_location !== "kesimhane" ? 500 : 0,
        share_price: sacrifice?.share_price || 0,
        total_amount: (sacrifice?.share_price || 0) + (shareholder.delivery_location !== "kesimhane" ? 500 : 0),
        sacrifice_consent: false,
        last_edited_by: matchingShareholder.name,
        purchased_by: matchingShareholder.name,
        sacrifice_id: sacrifice?.sacrifice_id || "",
      }))

      // Verileri DB'ye kaydet
      await createShareholders.mutateAsync(shareholderDataArray)
      onApprove()
    } catch (error) {
      console.error("Hissedarlar kaydedilirken hata oluştu:", error)
    }
  }

  return (
    <div className="space-y-8">
      <SacrificeInfo sacrifice={sacrifice} />

      <div className={`grid ${getGridClass(shareholders.length)} gap-12`}>
        {shareholders.map((shareholder, index) => (
          <div
            key={index}
            className="bg-[#F7F7F8] rounded-lg p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {index + 1}. Hissedar
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex">
                <span className="text-muted-foreground w-24">Ad Soyad:</span>
                <span>{shareholder.name}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-24">Telefon:</span>
                <span>{formatPhoneNumber(shareholder.phone)}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-24">Teslimat:</span>
                <span>{getDeliveryLocationText(shareholder.delivery_location)}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Hisse Bedeli:</span>
                  <span>{sacrifice?.share_price} ₺</span>
                </div>
                {shareholder.delivery_location !== "kesimhane" && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-muted-foreground">Teslimat Ücreti:</span>
                    <span>{500} ₺</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted-foreground">Toplam:</span>
                  <span>{calculateTotalAmount(sacrifice, shareholder.delivery_location)} ₺</span>
                </div>
              </div>
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
