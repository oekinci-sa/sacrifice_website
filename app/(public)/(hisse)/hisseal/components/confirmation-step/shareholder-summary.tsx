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
  } catch {
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
    if (isProcessing || !transaction_id) {
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

    try {
      // Validate shareholder count before proceeding
      if (!sacrifice?.sacrifice_id) {
        throw new Error("Kurbanlık ID bilgisi eksik!");
      }

      // Hem mutate hem de mutateAsync metodu için kontrol
      const validateMethod = validateShareholdersMutation?.mutateAsync || validateShareholdersMutation?.validate;
      if (!validateShareholdersMutation || !validateMethod) {
        throw new Error("Hissedar doğrulama fonksiyonu bulunamadı!");
      }

      await validateMethod({
        sacrificeId: sacrifice.sacrifice_id,
        newShareholderCount: shareholders.length
      });

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
          sacrifice_consent: false,
          total_amount: totalAmount,
          remaining_payment: remainingPayment
        }

        return shareholderData
      })

      // Save shareholders to DB - Hem mutate hem de mutateAsync metodu için kontrol
      const createMethod = createShareholdersMutation?.mutateAsync || createShareholdersMutation?.mutate;
      if (!createShareholdersMutation || !createMethod) {
        throw new Error("Hissedar kaydetme fonksiyonu bulunamadı!");
      }

      // Create shareholders in the database
      await createMethod(shareholderDataForApi);

      // Complete the reservation - Hem mutate hem de mutateAsync metodu için kontrol
      const completeMethod = completeReservationMutation?.mutateAsync || completeReservationMutation?.mutate;
      if (!completeReservationMutation || !completeMethod) {
        throw new Error("Rezervasyon tamamlama fonksiyonu bulunamadı!");
      }

      // Complete the reservation in the database
      await completeMethod({ transaction_id });

      // Close dialog and proceed
      setShowTermsDialog(false);

      // Call the onApprove function to proceed to success state
      if (typeof onApprove !== 'function') {
        throw new Error("onApprove fonksiyonu bulunamadı!");
      }
      onApprove();

    } catch (_error) {
      // Close dialog on error
      setShowTermsDialog(false);

      // Show appropriate error message based on the error type
      if (_error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: _error.message || "Hissedarlar kaydedilirken bir hata oluştu.",
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full mx-auto">
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
                <div className="absolute -top-3 right-4 bg-sac-primary text-white text-xs md:text-base py-1 px-2 rounded-full">
                  İşlemi Gerçekleştiren Kişi
                </div>
              )}

              <h3 className="text-lg md:text-xl font-semibold text-center mt-2 md:mt-0 mb-4 md:mb-6">
                {index + 1}. Hissedar Bilgileri
              </h3>

              <div className="grid grid-cols-2 gap-4 md:gap-8">
                {/* Sol Sütun */}
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <span className="text-[#5b725e] font-medium block text-[16px] md:text-lg">Ad Soyad</span>
                    <span className="text-black font-medium text-[16px] md:text-lg">{shareholder.name}</span>
                  </div>
                  <div>
                    <span className="text-[#5b725e] font-medium block text-[16px] md:text-lg">Teslimat Tercihi</span>
                    <span className="text-black font-medium text-[16px] md:text-lg">
                      {shareholder.delivery_location}
                    </span>
                  </div>
                </div>

                {/* Sağ Sütun */}
                <div>
                  <span className="text-[#5b725e] font-medium block text-[16px] md:text-lg">Telefon</span>
                  <span className="text-black font-medium text-[16px] md:text-lg">{formatPhoneNumber(shareholder.phone)}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 md:my-6 border-t border-dashed border-[#c7ddcd]" />

              {/* Alt Bilgiler */}
              <div className="grid grid-cols-2 gap-2 md:gap-8">
                <div className="space-y-2 md:space-y-4">
                  <div>
                    <span className="text-[#5b725e] font-medium block text-[16px] md:text-lg">Kurbanlık No</span>
                    <span className="text-black font-medium text-[16px] md:text-lg">{sacrifice?.sacrifice_no}</span>
                  </div>
                  <div>
                    <span className="text-[#5b725e] font-medium block text-[16px] md:text-lg">Hisse Bedeli</span>
                    <span className="text-black font-medium text-[16px] md:text-lg">{sacrifice?.share_price} TL</span>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-4">
                  <div>
                    <span className="text-[#5b725e] font-medium block text-[16px] md:text-lg">Kesim Saati</span>
                    <span className="text-black font-medium text-[16px] md:text-lg">
                      {formatSacrificeTime(sacrifice?.sacrifice_time || null)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-3 md:my-6 border-t border-dashed border-[#c7ddcd]" />

              {/* Toplam Ücret */}
              <div className="grid grid-cols-2 gap-2 md:gap-8">
                <span className="col-span-1 text-[#5b725e] font-medium text-[16px] md:text-lg">Toplam Ücret</span>
                <span className="col-span-1 text-black font-medium text-[16px] md:text-lg font-medium">
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
          className="bg-[#FCEFEF] hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 flex items-center justify-center h-10 md:h-12 px-3 md:px-4 flex-1 rounded-md"
          onClick={() => setCurrentStep("details")}
          disabled={isProcessing}
        >
          <ArrowLeft className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 mr-0.5 md:mr-2" />
          <span className="text-[16px] md:text-lg">Hissedar Bilgileri</span>
        </Button>

        <Button
          variant="ghost"
          className="bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300 flex items-center justify-center h-10 md:h-12 px-3 md:px-4 flex-1 rounded-md"
          onClick={handleOpenSecurityCodeDialog}
          disabled={isProcessing}
        >
          <span className="text-[16px] md:text-lg">Hisseleri Onayla</span>
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
