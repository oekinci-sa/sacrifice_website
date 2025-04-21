"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useCompleteReservation } from "@/hooks/useReservations"
import { useCreateShareholders } from "@/hooks/useShareholders"
import { useValidateShareholders } from "@/hooks/useValidateShareholders"
import { cn } from "@/lib/utils"
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore"
import { sacrificeSchema } from "@/types"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useState } from "react"
import SecurityCodeDialog from "./security-code-dialog"
import TermsAgreementDialog from "./terms-agreement-dialog"

type Step = "selection" | "details" | "confirmation"

interface ShareholderSummaryProps {
  sacrifice: sacrificeSchema | null
  shareholders: {
    name: string
    phone: string
    delivery_location: string
    is_purchaser?: boolean
    paid_amount?: number
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

// Format sacrifice time function
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
}: ShareholderSummaryProps) {
  // States for approval dialogs
  const [showSecurityCodeDialog, setShowSecurityCodeDialog] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [securityCode, setSecurityCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false);

  const createShareholdersMutation = useCreateShareholders()
  const completeReservationMutation = useCompleteReservation()
  const validateShareholdersMutation = useValidateShareholders()
  const { transaction_id } = useReservationIDStore()
  const { toast } = useToast()

  // Find the purchaser
  const purchaserIndex = shareholders.findIndex(shareholder => shareholder.is_purchaser === true)

  // If no purchaser is marked and there's only one shareholder, that shareholder is the purchaser
  const effectivePurchaserIndex = purchaserIndex === -1 && shareholders.length === 1 ? 0 : purchaserIndex

  // Open the security code dialog
  const handleOpenSecurityCodeDialog = () => {
    setShowSecurityCodeDialog(true)
    setShowTermsDialog(false)
  }

  // Security code dialog handler
  const handleSecurityCodeSet = (code: string) => {
    setSecurityCode(code)
    setShowSecurityCodeDialog(false)
    // Show terms agreement dialog after setting security code
    setShowTermsDialog(true)
  }

  // Handle going back to security code from terms
  const handleBackToSecurityCode = () => {
    setShowTermsDialog(false)
    setShowSecurityCodeDialog(true)
  }

  // Terms agreement dialog handler
  const handleTermsConfirm = async () => {
    console.log('handleTermsConfirm başlangıç', { isProcessing, transaction_id });
    if (isProcessing || !transaction_id) {
      console.error('İşlem zaten devam ediyor veya transaction_id yok', { isProcessing, transaction_id });
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem zaten devam ediyor veya işlem kimliği eksik."
      });
      return;
    }
    setIsProcessing(true);

    // Get the purchaser name (defaulting to first shareholder if none is marked)
    let purchaserName = ""
    if (effectivePurchaserIndex !== -1) {
      purchaserName = shareholders[effectivePurchaserIndex].name
    } else {
      // If for some reason we don't have a purchaser, use first shareholder
      purchaserName = shareholders[0].name
    }

    console.log('İşlemi yapan kişi:', {
      index: effectivePurchaserIndex,
      name: purchaserName,
      totalShareholders: shareholders.length,
      securityCode: securityCode // Include security code in debug log
    })

    try {
      // Validate shareholder count before proceeding
      console.log('Hissedar doğrulama başlıyor...', {
        sacrificeId: sacrifice?.sacrifice_id,
        newShareholderCount: shareholders.length
      });

      if (!sacrifice?.sacrifice_id) {
        throw new Error("Kurbanlık ID bilgisi eksik!");
      }

      if (!validateShareholdersMutation || !validateShareholdersMutation.mutateAsync) {
        throw new Error("Hissedar doğrulama fonksiyonu bulunamadı!");
      }

      await validateShareholdersMutation.mutateAsync({
        sacrificeId: sacrifice.sacrifice_id,
        newShareholderCount: shareholders.length
      });
      console.log('Hissedar doğrulama başarılı');

      // Prepare shareholder data for the API
      const shareholderDataForApi = shareholders.map((shareholder) => {
        // Clean and format phone number
        const cleanedPhone = shareholder.phone.replace(/\D/g, '').replace(/^0/, '')
          .replace(/^90/, '') // Remove leading 90
        const formattedPhone = cleanedPhone.startsWith('90')
          ? '+' + cleanedPhone
          : '+90' + cleanedPhone

        // Calculate the delivery fee based on location
        const delivery_fee = shareholder.delivery_location !== "Kesimhane" ? 750 : 0

        // Calculate total amount and remaining payment
        const share_price = sacrifice?.share_price || 0
        const totalAmount = share_price + delivery_fee
        // Ensure paidAmount is always a number
        const paidAmount = shareholder.paid_amount !== undefined ? shareholder.paid_amount : 0

        const remainingPayment = totalAmount - paidAmount;


        // Create the data object without the is_purchaser field
        const shareholderData = {
          shareholder_name: shareholder.name,
          phone_number: formattedPhone,
          transaction_id: transaction_id,
          sacrifice_id: sacrifice?.sacrifice_id || "",
          share_price: share_price,
          delivery_fee: delivery_fee,
          delivery_location: shareholder.delivery_location,
          security_code: securityCode,
          purchased_by: purchaserName,
          last_edited_by: purchaserName,
          sacrifice_consent: true, // Set to true since user agreed to terms
          total_amount: totalAmount,
          remaining_payment: remainingPayment
        }

        return shareholderData
      })

      console.log('Hissedar verileri oluşturuldu', shareholderDataForApi);

      // Save shareholders to DB
      console.log('Hissedarlar kaydediliyor...');
      if (!createShareholdersMutation || !createShareholdersMutation.mutateAsync) {
        throw new Error("Hissedar kaydetme fonksiyonu bulunamadı!");
      }

      const createResult = await createShareholdersMutation.mutateAsync(shareholderDataForApi);
      console.log('Hissedarlar başarıyla kaydedildi', createResult);

      // Complete the reservation
      console.log('Rezervasyon tamamlanıyor...', { transaction_id });
      if (!completeReservationMutation || !completeReservationMutation.mutateAsync) {
        throw new Error("Rezervasyon tamamlama fonksiyonu bulunamadı!");
      }

      const completeResult = await completeReservationMutation.mutateAsync({ transaction_id });
      console.log('Rezervasyon başarıyla tamamlandı', completeResult);

      // Close dialog and proceed
      setShowTermsDialog(false);

      // Call the onApprove function to proceed to success state
      console.log('onApprove fonksiyonu çağrılıyor...');
      if (typeof onApprove !== 'function') {
        throw new Error("onApprove fonksiyonu bulunamadı!");
      }
      onApprove();
      console.log('onApprove fonksiyonu çağrıldı');

      toast({
        title: "Başarılı!",
        description: "Hissedarlar kaydedildi ve rezervasyon tamamlandı.",
      });

    } catch (error) {
      console.error("İşlem sırasında hata oluştu:", error);
      if (error instanceof Error) {
        console.error("Hata mesajı:", error.message);
        console.error("Hata stack:", error.stack);
      }
      console.error("Hata detayları:", JSON.stringify(error, null, 2));

      // Close dialog on error
      setShowTermsDialog(false);

      // Show appropriate error message based on the error type
      if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: error.message || "Hissedarlar kaydedilirken bir hata oluştu.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hissedarlar kaydedilirken bir hata oluştu.",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 w-full mx-auto">
        {shareholders.map((shareholder, index) => {
          // Check if this shareholder is the purchaser
          const isPurchaser = index === effectivePurchaserIndex

          return (
            <div
              key={index}
              className={cn(
                "bg-[#fcfcfa] rounded-lg border border-dashed",
                isPurchaser ? "border-[#b8c7dd]" : "border-[#c7ddcd]", // Different border for purchaser
                "p-4 md:p-6 w-full relative", // Added relative for badge positioning
                shareholders.length === 1 ? "md:col-span-2 md:w-1/2 md:mx-auto" : "",
                shareholders.length % 2 === 1 && index === shareholders.length - 1 ? "md:col-span-2 md:w-1/2 md:mx-auto" : ""
              )}
            >
              {/* Purchaser badge - only shown for the purchaser */}
              {isPurchaser && shareholders.length > 1 && (
                <div className="absolute -top-2 right-4 bg-blue-500 text-white text-[8px] md:text-xs py-1 px-2 rounded-full">
                  İşlemi Gerçekleştiren Kişi
                </div>
              )}

              <h3 className="text-sm md:text-lg font-semibold text-center mb-4 md:mb-6">
                {index + 1}. Hissedar Bilgileri
              </h3>

              <div className="grid grid-cols-2 gap-4 md:gap-8">
                {/* Sol Sütun */}
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <span className="text-[#5b725e] block text-xs md:text-base">Ad Soyad</span>
                    <span className="text-black text-sm md:text-lg">{shareholder.name}</span>
                  </div>
                  <div>
                    <span className="text-[#5b725e] block text-xs md:text-base">Teslimat Tercihi</span>
                    <span className="text-black text-sm md:text-lg">
                      {shareholder.delivery_location}
                    </span>
                  </div>
                </div>

                {/* Sağ Sütun */}
                <div>
                  <span className="text-[#5b725e] block text-xs md:text-base">Telefon</span>
                  <span className="text-black text-sm md:text-lg">{formatPhoneNumber(shareholder.phone)}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 md:my-6 border-t border-dashed border-[#c7ddcd]" />

              {/* Alt Bilgiler */}
              <div className="grid grid-cols-2 gap-2 md:gap-8">
                <div className="space-y-2 md:space-y-4">
                  <div>
                    <span className="text-[#5b725e] block text-[10px] md:text-base">Kurbanlık No</span>
                    <span className="text-black text-xs md:text-lg">{sacrifice?.sacrifice_no}</span>
                  </div>
                  <div>
                    <span className="text-[#5b725e] block text-[10px] md:text-base">Hisse Bedeli</span>
                    <span className="text-black text-xs md:text-lg">{sacrifice?.share_price} TL</span>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-4">
                  <div>
                    <span className="text-[#5b725e] block text-[10px] md:text-base">Kesim Saati</span>
                    <span className="text-black text-xs md:text-lg">
                      {formatSacrificeTime(sacrifice?.sacrifice_time || null)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-3 md:my-6 border-t border-dashed border-[#c7ddcd]" />

              {/* Toplam Ücret */}
              <div className="grid grid-cols-2 gap-2 md:gap-8">
                <span className="col-span-1 text-[#5b725e] text-[10px] md:text-base">Toplam Ücret</span>
                <span className="col-span-1 text-black text-xs md:text-lg font-medium">
                  {new Intl.NumberFormat('tr-TR').format(
                    shareholder.delivery_location !== "Kesimhane"
                      ? (sacrifice?.share_price || 0) + 750
                      : (sacrifice?.share_price || 0)
                  )} TL
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center gap-4 w-full max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="bg-[#FCEFEF] hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 flex items-center justify-center h-8 md:h-10 px-3 md:px-4 flex-1 rounded-full"
          onClick={() => setCurrentStep("details")}
          disabled={isProcessing}
        >
          <ArrowLeft className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 mr-0.5 md:mr-2" />
          <span className="text-xs md:text-base">Hissedar Bilgileri</span>
        </Button>

        <Button
          variant="ghost"
          className="bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300 flex items-center justify-center h-8 md:h-10 px-3 md:px-4 flex-1 rounded-full"
          onClick={handleOpenSecurityCodeDialog}
          disabled={isProcessing}
        >
          <span className="text-xs md:text-base">Hisseleri Onayla</span>
          <ArrowRight className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 ml-0.5 md:ml-2" />
        </Button>
      </div>

      {/* Security Code Dialog - pass the existing code to preserve it */}
      <SecurityCodeDialog
        open={showSecurityCodeDialog}
        onOpenChange={setShowSecurityCodeDialog}
        onSecurityCodeSet={handleSecurityCodeSet}
        initialCode={securityCode}
      />

      {/* Terms Agreement Dialog - add back to security code handler */}
      <TermsAgreementDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onConfirm={handleTermsConfirm}
        onBackToSecurityCode={handleBackToSecurityCode}
        securityCode={securityCode}
      />
    </div>
  )
} 
