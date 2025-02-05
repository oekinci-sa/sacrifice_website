"use client"

import { Check } from "lucide-react"

interface ProgressBarProps {
  currentStep: "selection" | "details" | "confirmation" | "success"
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  const steps = [
    { id: "selection", label: "Hisse Seçimi", number: 1 },
    { id: "details", label: "Hissedar Bilgileri", number: 2 },
    { id: "confirmation", label: "Onay", number: 3 },
  ]

  const getCurrentStepIndex = () => {
    if (currentStep === "success") return 3
    return steps.findIndex(step => step.id === currentStep)
  }

  const stepIndex = getCurrentStepIndex()

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="relative">
        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isActive = index <= stepIndex
            const isCompleted = index < stepIndex

            return (
              <div key={step.id} className="flex flex-col items-center">
                <span
                  className="text-base font-medium mb-3 text-black"
                  style={{ fontSize: '1.125rem' }}
                >
                  {step.label}
                </span>
                <div
                  className={`w-15 h-15 rounded-full flex items-center justify-center text-base font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-[#22C55E] text-white"
                      : "bg-[#EAEAEA] text-[#AFAFAF]"
                  }`}
                  style={{ width: '3.75rem', height: '3.75rem' }}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <span className="text-xl">{step.number}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 