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
import { useToast } from "@/hooks/use-toast"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

interface PhoneVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerificationComplete: (phone: string) => void
  shareholders: Array<{
    name: string
    phone: string
  }>
}

export default function PhoneVerificationDialog({
  open,
  onOpenChange,
  onVerificationComplete,
}: PhoneVerificationDialogProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { setSuccess, goToStep } = useHisseStore()

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
    setIsLoading(true)
    try {
      const otpValue = otp.join("")
      if (otpValue === "111111") {
        // Telefon numarasını temizle ve formatla
        const cleanedPhone = phone.replace(/\D/g, '')
          .replace(/^0/, '') // Baştaki 0'ı kaldır
        
        // Formatlanmış telefon numarası
        const formattedPhone = "+90" + cleanedPhone
        
        console.log("Doğrulama tamamlandı, telefon:", formattedPhone)
        
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        toast({
          title: "Başarılı",
          description: "Telefon numaranız doğrulandı.",
        })

        onVerificationComplete(formattedPhone)
        setSuccess(true)
        goToStep("success")
        handleClose()
      } else {
        setError("Geçersiz doğrulama kodu")
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Doğrulama kodu gönderilirken bir hata oluştu.",
      })
    } finally {
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
          <DialogTitle>
            {step === 'phone' ? 'Telefon Numarası Doğrulama' : 'Doğrulama Kodu'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'phone' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Lütfen telefon numaranızı giriniz. Size bir doğrulama kodu gönderilecektir.
              </p>
              <Input
                placeholder="05XX XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-base"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end">
                <Button onClick={handlePhoneSubmit}>
                  Doğrulama Kodu Gönder
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Lütfen telefonunuza gönderilen 6 haneli doğrulama kodunu giriniz.
              </p>
              <div className="flex justify-center">
                <InputOTP
                  value={otp.join("")}
                  onChange={handleOtpChange}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end">
                <Button onClick={handleOtpSubmit} disabled={isLoading}>
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