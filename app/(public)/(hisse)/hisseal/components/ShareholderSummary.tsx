import { Card, CardContent } from "@/components/ui/card"
import { sacrificeSchema } from "@/types"
import { z } from "zod"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { OtpInput } from "@/components/ui/otp-input"
import { useShareholderStore } from "@/stores/useShareholderStore"

const formSchema = z.object({
  name: z.string(),
  phone: z.string(),
  delivery_location: z.string(),
})

type FormData = z.infer<typeof formSchema>

interface ShareholderSummaryProps {
  sacrifice: sacrificeSchema | null
  shareholders: FormData[]
  onApprove: () => void
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
      return ""
  }
}

// Function to format phone number to DB format (+905555555555)
const formatPhoneForDB = (phone: string): string => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "")
  
  // Remove leading 0 if exists
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1)
  }
  
  // Take only the last 10 digits
  cleaned = cleaned.slice(-10)
  
  // Add +90 prefix to ensure exactly 13 characters
  return "+90" + cleaned
}

// Function to validate phone number format
const validatePhoneNumber = (phone: string): boolean => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "")
  
  // Must start with 0 and have exactly 11 digits
  if (!cleaned.startsWith("0") || cleaned.length !== 11) {
    return false
  }

  // The remaining 10 digits must be valid (not all zeros, etc)
  const remainingDigits = cleaned.slice(1)
  if (!/^[1-9]\d{9}$/.test(remainingDigits)) {
    return false
  }

  return true
}

export default function ShareholderSummary({
  sacrifice,
  shareholders,
  onApprove,
}: ShareholderSummaryProps) {
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  
  const { createShareholders, isLoading } = useShareholderStore()

  const calculateTotalAmount = (delivery_location: string) => {
    if (!sacrifice?.share_price) return 0
    const baseAmount = sacrifice.share_price
    const deliveryFee = delivery_location !== "kesimhane" ? 500 : 0
    return baseAmount + deliveryFee
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('tr-TR') + '₺'
  }

  const getGridCols = (count: number) => {
    if (count <= 1) return "grid-cols-1"
    if (count <= 3) return "grid-cols-2 lg:grid-cols-3"
    if (count <= 4) return "grid-cols-2"
    return "grid-cols-3" // for 5-7 shareholders
  }

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return "";
    return timeString.split(":").slice(0, 2).join(":");
  }

  const handlePhoneSubmit = () => {
    // Validate phone number
    if (!phone) {
      toast.error("Lütfen telefon numaranızı girin")
      return
    }

    if (!validatePhoneNumber(phone)) {
      toast.error("Geçerli bir telefon numarası girin (05XX XXX XX XX)")
      return
    }

    // Close phone dialog and open OTP dialog
    setShowPhoneDialog(false)
    setShowOtpDialog(true)
  }

  const handleOtpSubmit = async () => {
    // Validate OTP
    if (!otp) {
      toast.error("Lütfen doğrulama kodunu girin")
      return
    }

    if (otp !== "111111") {
      toast.error("Geçersiz doğrulama kodu")
      return
    }

    try {
      // Prevent duplicate submissions if already loading
      if (isLoading) {
        console.warn("Submission already in progress")
        return
      }

      // Check if sacrifice_id exists
      if (!sacrifice?.sacrifice_id) {
        toast.error("Kurban bilgisi bulunamadı")
        return
      }

      // Prepare shareholder data
      const shareholderData = shareholders.map((shareholder) => {
        // Validate phone number format
        if (!validatePhoneNumber(shareholder.phone)) {
          throw new Error(`Geçersiz telefon numarası: ${shareholder.phone}`)
        }

        // Format phone number for database
        const formattedPhone = formatPhoneForDB(shareholder.phone)

        // Validate formatted phone number
        if (!formattedPhone.startsWith('+90') || formattedPhone.length !== 13) {
          throw new Error(`Hatalı telefon numarası formatı: ${formattedPhone}`)
        }

        // Calculate amounts
        const deliveryFee = shareholder.delivery_location !== "kesimhane" ? 500 : 0
        const totalAmount = calculateTotalAmount(shareholder.delivery_location)

        return {
          shareholder_name: shareholder.name,
          phone_number: formattedPhone,
          delivery_location: shareholder.delivery_location,
          delivery_fee: deliveryFee,
          share_price: sacrifice.share_price || 0,
          total_amount: totalAmount,
          sacrifice_consent: false,
          last_edited_by: shareholder.name,
          sacrifice_id: sacrifice.sacrifice_id,
          paid_amount: 0,
          remaining_payment: totalAmount
        }
      })

      // Save to database using Zustand store
      await createShareholders(shareholderData)

      // Close OTP dialog and proceed
      setShowOtpDialog(false)
      onApprove()
    } catch (error) {
      // Error is already handled in the store
      console.error("Error saving shareholders:", error)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-lg font-semibold mb-4">
          Kurban Bilgileri
        </h4>
        <div className="space-y-4 text-base">
          <div className="flex items-center">
            <span className="text-muted-foreground w-24">Kurban No</span>
            <span className="font-medium">{sacrifice?.sacrifice_no}</span>
          </div>
          <div className="flex items-center">
            <span className="text-muted-foreground w-24">Kesim Saati</span>
            <span className="font-medium">{formatTime(sacrifice?.sacrifice_time)}</span>
          </div>
          <div className="flex items-center">
            <span className="text-muted-foreground w-24">Hisse Bedeli</span>
            <span className="font-medium">{formatPrice(sacrifice?.share_price || 0)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Hissedar Bilgileri</h3>
        <div className={`grid ${getGridCols(shareholders.length)} gap-6`}>
          {shareholders.map((shareholder, index) => (
            <div key={index} className="rounded-lg border p-6">
              <div>
                <h4 className="text-lg font-semibold mb-4">
                  {index + 1}. Hissedar
                </h4>
                <div className="space-y-4 text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ad Soyad</span>
                    <span className="font-medium">{shareholder.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Telefon</span>
                    <span className="font-medium">{shareholder.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Teslimat</span>
                    <span className="font-medium">{getDeliveryLocationText(shareholder.delivery_location)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 mt-2 border-t">
                    <span className="text-muted-foreground">Toplam Tutar</span>
                    <span className="font-medium">{formatPrice(calculateTotalAmount(shareholder.delivery_location))}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Geri Dön
        </Button>
        <Button onClick={() => setShowPhoneDialog(true)}>
          Onayla ve Tamamla
        </Button>
      </div>

      {/* Phone Verification Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Telefon Doğrulama</DialogTitle>
            <DialogDescription>
              Lütfen işlemi onaylamak için telefon numaranızı girin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Telefon numaranızı girin (05XX XXX XX XX)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>
              İptal
            </Button>
            <Button onClick={handlePhoneSubmit}>
              Devam Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SMS Doğrulama</DialogTitle>
            <DialogDescription>
              Telefonunuza gönderilen 6 haneli doğrulama kodunu girin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <OtpInput
              value={otp}
              onChange={setOtp}
              className="justify-center"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOtpDialog(false)}>
              İptal
            </Button>
            <Button 
              onClick={handleOtpSubmit} 
              disabled={isLoading}
            >
              {isLoading ? "Kaydediliyor..." : "Onayla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 