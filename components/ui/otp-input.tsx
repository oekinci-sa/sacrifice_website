"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface OtpInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChange: (value: string) => void
  length?: number
}

const OtpInput = React.forwardRef<HTMLInputElement, OtpInputProps>(
  ({ className, value, onChange, length = 6, ...props }, ref) => {
    const [otp, setOtp] = React.useState<string[]>(value.split("").slice(0, length))
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    React.useEffect(() => {
      setOtp(value.split("").slice(0, length))
    }, [value, length])

    const handleChange = (index: number, digit: string) => {
      if (digit.length > 1) return // Prevent pasting multiple characters

      const newOtp = [...otp]
      newOtp[index] = digit
      setOtp(newOtp)
      onChange(newOtp.join(""))

      // Move to next input if there's a value
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        // Move to previous input on backspace if current input is empty
        inputRefs.current[index - 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData("text/plain").slice(0, length)
      onChange(pastedData)
      
      // Focus last input after paste
      if (pastedData.length === length) {
        inputRefs.current[length - 1]?.focus()
      }
    }

    return (
      <div className={cn("flex gap-2", className)}>
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={otp[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-12 h-12 text-center text-lg p-0 aspect-square"
            {...props}
          />
        ))}
      </div>
    )
  }
)
OtpInput.displayName = "OtpInput"

export { OtpInput } 