"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useRef, useState } from "react"

interface SecurityCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSecurityCodeSet: (code: string) => void
  initialCode?: string
}

export default function SecurityCodeDialog({
  open,
  onOpenChange,
  onSecurityCodeSet,
  initialCode = "",
}: SecurityCodeDialogProps) {
  const { toast } = useToast()
  const confirmInputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState<string>(initialCode || "")
  const [confirmCode, setConfirmCode] = useState<string>("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setCode(initialCode || "")
      setConfirmCode("")
      setError("")
      setIsLoading(false)
    }
  }, [initialCode, open])

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6)
    setCode(v)
    setError("")
    if (v.length === 6) {
      requestAnimationFrame(() => {
        confirmInputRef.current?.focus()
      })
    }
  }

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6)
    setConfirmCode(v)
    setError("")
  }

  const bothSix = code.length === 6 && confirmCode.length === 6

  const validateAndSubmit = () => {
    if (isLoading) return

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("Lütfen 6 rakamlı bir kod belirleyiniz.")
      return
    }
    if (confirmCode.length !== 6) {
      setError("Lütfen güvenlik kodunuzu tekrar giriniz.")
      return
    }
    if (code !== confirmCode) {
      setError("Girdiğiniz kodlar eşleşmiyor. Lütfen kontrol ediniz.")
      toast({
        variant: "destructive",
        title: "Güvenlik kodları eşleşmiyor",
        description:
          "Girdiğiniz güvenlik kodları birbiriyle aynı değil. Lütfen aynı 6 rakamı her iki alana da giriniz.",
      })
      return
    }

    setIsLoading(true)
    setError("")
    try {
      onSecurityCodeSet(code)
      setIsLoading(false)
    } catch {
      setError("İşlem sırasında bir hata oluştu.")
      setIsLoading(false)
    }
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError("")
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg text-center">
            Kendi Güvenlik Kodunuzu Belirleyin
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mb-4">
          <p className="text-sm md:text-base text-muted-foreground text-center">
            Hisse sorgulama sayfasında bilgilerinize erişmek için{" "}
            <strong className="text-primary">kendinizin belirleyeceği</strong> 6 rakamlı bir kod oluşturun.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="security-code-primary" className="text-sm font-medium text-muted-foreground">
                6 rakamlı kodunuzu belirleyin
              </label>
              <Input
                id="security-code-primary"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                value={code}
                onChange={handlePrimaryChange}
                autoComplete="one-time-code"
                spellCheck={false}
                className="text-center text-lg tracking-[0.35em] font-mono tabular-nums text-black caret-foreground [-webkit-text-security:disc]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="security-code-confirm" className="text-sm font-medium text-muted-foreground">
                Güvenlik kodunuzu tekrar giriniz
              </label>
              <Input
                ref={confirmInputRef}
                id="security-code-confirm"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                value={confirmCode}
                onChange={handleConfirmChange}
                autoComplete="off"
                spellCheck={false}
                className="text-center text-lg tracking-[0.35em] font-mono tabular-nums text-black caret-foreground [-webkit-text-security:disc]"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs md:text-sm text-destructive text-center">{error}</p>
        )}

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={validateAndSubmit}
            disabled={!bothSix || isLoading}
            className="h-10 md:h-12 text-base md:text-lg whitespace-nowrap mx-auto"
          >
            Onayla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
