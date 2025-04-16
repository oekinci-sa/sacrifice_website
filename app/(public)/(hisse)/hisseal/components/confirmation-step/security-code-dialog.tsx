"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

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
  const [securityCode, setSecurityCode] = useState<string[]>(initialCode.split('') || ["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Update security code when initialCode changes
  useEffect(() => {
    if (initialCode) {
      setSecurityCode(initialCode.padEnd(6, '').split('').slice(0, 6))
    }
  }, [initialCode, open])

  const handleSecurityCodeChange = (value: string) => {
    setSecurityCode(value.split(''))
    // Remove the auto-submit functionality
  }

  const validateAndSubmit = () => {
    if (isLoading) return // Prevent double submission
    
    const code = securityCode.join("")
    
    // Validate that code is 6 digits
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("Lütfen 6 haneli bir güvenlik kodu giriniz.")
      return
    }
    
    setIsLoading(true)
    setError("")
    
    try {
      // Pass the security code to parent component
      onSecurityCodeSet(code)
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
              <InputOTP
                value={securityCode.join("")}
                onChange={handleSecurityCodeChange}
                maxLength={6}
                // Increase the size of input boxes by applying custom classes
                className="gap-3"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot 
                      key={i} 
                      index={i} 
                      className="w-12 h-12 sm:w-14 sm:h-14 text-xl [&>.cursor]:w-1.5 [&>.cursor]:h-8 [&>.cursor]:bg-primary" // Enhanced cursor styling
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-xs sm:text-sm text-destructive text-center">{error}</p>}
            <div className="flex justify-center">
              <Button 
                onClick={validateAndSubmit}
                disabled={isLoading || securityCode.join("").length !== 6}
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