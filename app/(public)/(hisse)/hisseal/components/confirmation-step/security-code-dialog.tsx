"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import OTPOriginUI from "../../../components/otp-origin-ui"

interface SecurityCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSecurityCodeSet: (code: string) => void
  initialCode?: string // Allow passing an initial code
}

export default function SecurityCodeDialog({
  open,
  onOpenChange,
  onSecurityCodeSet,
  initialCode = "",
}: SecurityCodeDialogProps) {
  const [securityCode, setSecurityCode] = useState<string>(initialCode || "")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Update security code when initialCode changes
  useEffect(() => {
    if (initialCode) {
      setSecurityCode(initialCode)
    }
  }, [initialCode, open])

  const handleSecurityCodeChange = (value: string) => {
    // Only allow numerical values
    if (/^\d*$/.test(value)) {
      setSecurityCode(value)
    }
  }

  const validateAndSubmit = () => {
    if (isLoading) return // Prevent double submission

    // Validate that code is 6 digits
    if (securityCode.length !== 6 || !/^\d{6}$/.test(securityCode)) {
      setError("Lütfen 6 haneli bir güvenlik kodu giriniz.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Pass the security code to parent component
      onSecurityCodeSet(securityCode)
      // Keep the dialog open because we'll control closing in the parent
      setIsLoading(false)
    } catch (error) {
      console.error("Güvenlik kodu ayarlanırken hata:", error)
      setError("İşlem sırasında bir hata oluştu.")
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    setIsLoading(false)
    // We don't reset the security code here to preserve it
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl text-center">
            Güvenlik Kodu Belirleme
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-6">
            <p className="text-base md:text-lg text-muted-foreground text-center">
              Lütfen daha sonra hisse sorgulama işleminizi güvenli bir şekilde yapmak için 6 rakamlı bir güvenlik kodu belirleyin.
            </p>
            <div className="flex justify-center">
              <OTPOriginUI
                value={securityCode}
                onChange={handleSecurityCodeChange}
                maxLength={6}
              />
            </div>
            {error && <p className="text-xs sm:text-sm text-destructive text-center">{error}</p>}
            <div className="flex justify-center">
              <Button
                onClick={validateAndSubmit}
                disabled={isLoading || securityCode.length !== 6}
                className="w-40 h-10 sm:h-12 text-sm"
              >
                Onayla
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 