"use client"

import { OTPInput, SlotProps } from "input-otp"
import { useId } from "react"

import { cn } from "@/lib/utils"

interface OTPOriginUIProps {
  value?: string
  onChange?: (value: string) => void
  maxLength?: number
}

export default function OTPOriginUI({
  value = "",
  onChange,
  maxLength = 6
}: OTPOriginUIProps) {
  const id = useId()

  const handleChange = (value: string) => {
    // Only pass numeric values to the parent component
    if (onChange) {
      const numericValue = value.replace(/\D/g, '');
      onChange(numericValue);
    }
  }

  return (
    <div className="*:not-first:mt-2">
      <OTPInput
        id={id}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        containerClassName="flex items-center gap-3 has-disabled:opacity-50"
        render={({ slots }) => (
          <div className="flex gap-2">
            {slots.map((slot, idx) => (
              <Slot key={idx} {...slot} />
            ))}
          </div>
        )}
      />
    </div>
  )
}

function Slot(props: SlotProps) {
  return (
    <div
      className={cn(
        "border-input bg-background text-foreground flex size-9 sm:size-12 items-center justify-center rounded-md border font-medium shadow-xs transition-[color,box-shadow] text-xl",
        { "border-ring ring-ring/50 z-10 ring-[3px]": props.isActive }
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
    </div>
  )
} 