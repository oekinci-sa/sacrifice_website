"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { X } from "lucide-react"
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
  shareholders,
}: PhoneVerificationDialogProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { setSuccess, goToStep } = useHisseStore()
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Sadece tek karakter

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    // Sonraki input'a geç
    if (value !== "" && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace tuşuna basıldığında ve input boşsa, önceki input'a git
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs[index - 1].current?.focus()
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
        setStep('phone')
        setPhone("")
        setOtp(["", "", "", "", "", ""])
      } else {
        setError("Geçersiz doğrulama kodu")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Doğrulama sırasında bir hata oluştu.",
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
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-12 text-center text-lg"
                  />
                ))}
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