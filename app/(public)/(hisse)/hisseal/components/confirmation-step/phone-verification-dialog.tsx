"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useHisseStore } from "@/stores/useHisseStore"
import { useToast } from "@/components/ui/use-toast"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PhoneVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerificationComplete: (phone: string, purchased_by: string) => void
  shareholders: Array<{
    name: string
    phone: string
  }>
}

export default function PhoneVerificationDialog({
  open,
  onOpenChange,
  onVerificationComplete,
  shareholders,
}: PhoneVerificationDialogProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { setSuccess, goToStep } = useHisseStore()

  // Tek hissedar varsa, başlangıçta onun numarasını seç
  useState(() => {
    if (shareholders.length === 1) {
      setPhone(shareholders[0].phone)
    }
  })

  const formatPhoneDisplay = (phone: string) => {
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

  const handlePhoneSubmit = () => {
    // Telefon numarasını temizle ve formatla
    const cleanedPhone = phone.replace(/\D/g, '')
    if (cleanedPhone.length !== 11 || !cleanedPhone.startsWith('0')) {
      setError("Geçerli bir telefon numarası giriniz (05XX XXX XX XX)")
      return
    }
    
    setError("")
    setStep('otp')
  }

  const handleOtpChange = (value: string) => {
    setOtp(value.split(''))
    
    if (value.length === 6) {
      handleOtpSubmit()
    }
  }

  const handleOtpSubmit = async () => {
    if (isLoading) return; // Prevent double submission
    setIsLoading(true);
    setError("");
    
    try {
      const otpValue = otp.join("");
      console.log("OTP Value:", otpValue); // Debug için
      
      if (otpValue === "111111") {
        // Telefon numarasını temizle ve formatla
        const cleanedPhone = phone.replace(/\D/g, '')
          .replace(/^0/, '') // Baştaki 0'ı kaldır
        
        // Formatlanmış telefon numarası - DB için +90XXXXXXXXXX formatında
        const formattedPhone = cleanedPhone.startsWith('90') 
          ? '+' + cleanedPhone 
          : '+90' + cleanedPhone

        // Doğrulanan telefon numarasına sahip hissedarı bul
        const verifiedShareholder = shareholders.find(s => {
          const shareholderPhone = s.phone.replace(/\D/g, '')
            .replace(/^0/, '')
            .replace(/^90/, '')
          return shareholderPhone === cleanedPhone.replace(/^90/, '')
        })

        if (!verifiedShareholder) {
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Doğrulanan telefon numarasına sahip hissedar bulunamadı.",
          })
          setIsLoading(false)
          return
        }

        // DB işlemini yap - verifiedShareholder.name'i purchased_by olarak kullan
        await onVerificationComplete(formattedPhone, verifiedShareholder.name)

        // Başarılı toast göster
        toast({
          title: "Başarılı",
          description: "Telefon numaranız doğrulandı.",
        })

        // Success state'i güncelle
        setSuccess(true)
        goToStep("success")
        
        // Dialog'u kapat
        handleClose()
      } else {
        setError("Geçersiz doğrulama kodu")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Doğrulama hatası:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
      })
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('phone')
    setPhone("")
    setOtp(["", "", "", "", "", ""])
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg text-center">
            {step === 'phone' ? 'Telefon Numarası Doğrulama' : 'Doğrulama Kodu'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'phone' ? (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Hisse onayınızı tamamlamak için bir telefon numarası üzerinden SMS doğrulaması yapmanız gerekmektedir. Lütfen doğrulama kodunu alacağınız telefon numarasını seçin.
              </p>
              <div className="flex gap-2 items-start">
                <Select
                  value={phone}
                  onValueChange={setPhone}
                >
                  <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                    <SelectValue placeholder="Telefon numarası seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareholders.map((shareholder, index) => (
                      <SelectItem 
                        key={index} 
                        value={shareholder.phone}
                        className="text-xs sm:text-sm"
                      >
                        {formatPhoneDisplay(shareholder.phone)} - {shareholder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handlePhoneSubmit}
                  className="whitespace-nowrap h-8 sm:h-10 text-xs sm:text-sm"
                  disabled={!phone}
                >
                  Doğrulama Kodu Gönder
                </Button>
              </div>
              {error && <p className="text-xs sm:text-sm text-destructive text-center">{error}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Lütfen {formatPhoneDisplay(phone)} numaralı telefona gönderilen 6 haneli doğrulama kodunu giriniz.
              </p>
              <div className="flex justify-center">
                <InputOTP
                  value={otp.join("")}
                  onChange={handleOtpChange}
                  maxLength={6}
                  className="gap-2"
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && <p className="text-xs sm:text-sm text-destructive text-center">{error}</p>}
              <div className="flex justify-center">
                <Button 
                  onClick={handleOtpSubmit} 
                  disabled={isLoading}
                  className="w-32 h-8 sm:h-10 text-xs sm:text-sm"
                >
                  Doğrula
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 