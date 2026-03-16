"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [showCode, setShowCode] = useState(false)

  // Update security code when initialCode changes
  useEffect(() => {
    if (initialCode) {
      setSecurityCode(initialCode)
    }
  }, [initialCode, open])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6)
    setSecurityCode(v)
    setError("")
  }

  const validateAndSubmit = () => {
    if (isLoading) return // Prevent double submission

    // Validate that code is 6 digits
    if (securityCode.length !== 6 || !/^\d{6}$/.test(securityCode)) {
      setError("Lütfen 6 rakamlı bir kod belirleyiniz.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Pass the security code to parent component
      onSecurityCodeSet(securityCode)
      // Keep the dialog open because we'll control closing in the parent
      setIsLoading(false)
    } catch {
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
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg text-center">
            Kendi Güvenlik Kodunuzu Belirleyin
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mb-4">
          <p className="text-sm md:text-base text-muted-foreground text-center">
            Hisse sorgulama sayfasında bilgilerinize erişmek için <strong className="text-primary">kendinizin belirleyeceği</strong> 6 rakamlı bir kod oluşturun.
          </p>

          <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/70 px-4 py-3.5 shadow-sm">
            <p className="text-sm md:text-base text-amber-900/90 leading-snug text-center">
              Bu kodu not alın — hisse sorgularken telefon numaranızla birlikte girmeniz gerekecek.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="security-code" className="text-sm font-medium text-muted-foreground text-center">
              6 rakamlı kodunuzu belirleyin
            </label>
            <div className="relative flex items-center justify-center h-12 rounded-md border border-input bg-background pr-12 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-2">
              {/* Görünmez input - tıklama ve klavye için */}
              <Input
                id="security-code"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                value={securityCode}
                onChange={handleCodeChange}
                autoComplete="one-time-code"
                className="absolute inset-0 opacity-0 cursor-default caret-transparent pr-12"
              />
              {/* 6 daire: yazılanlar dolu, boşlar placeholder */}
              <div
                className="absolute inset-0 flex items-center justify-center gap-1.5 pr-12 pointer-events-none"
                aria-hidden
              >
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const hasDigit = i < securityCode.length
                  return (
                    <span
                      key={`${i}-${hasDigit}`}
                      className={cn(
                        "inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-semibold tabular-nums transition-all duration-500",
                        hasDigit
                          ? "bg-foreground text-background animate-in zoom-in-50 duration-500"
                          : "bg-muted-foreground/40 animate-placeholder-breathe"
                      )}
                      style={
                        !hasDigit ? { animationDelay: `${i * 200}ms` } : undefined
                      }
                    >
                      {hasDigit && showCode ? securityCode[i] : null}
                    </span>
                  )
                })}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                onClick={() => setShowCode((p) => !p)}
                aria-label={showCode ? "Kodu gizle" : "Kodu göster"}
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        {error && <p className="text-xs md:text-sm text-destructive text-center">{error}</p>}
        <div className="flex justify-center">
          <Button
            onClick={validateAndSubmit}
            disabled={isLoading || securityCode.length !== 6}
            className="h-10 md:h-12 text-base md:text-lg whitespace-nowrap mx-auto"
          >
            Onayla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 