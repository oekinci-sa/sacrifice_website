"use client"

import { Check } from "lucide-react"

interface ProgressBarProps {
  currentStep: "selection" | "details" | "confirmation" | "success"
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  const steps = [
    { id: "selection", label: "Hisse\nSeçimi", number: 1 },
    { id: "details", label: "Hissedar\nBilgileri", number: 2 },
    { id: "confirmation", label: "Hisse\nOnay", number: 3 },
  ]

  const getCurrentStepIndex = () => {
    if (currentStep === "success") return 3
    return steps.findIndex(step => step.id === currentStep)
  }

  const stepIndex = getCurrentStepIndex()

  return (
    <div className="w-full max-w-5xl mx-auto my-8 md:my-8">
      <div className="relative">
        {/* Steps */}
        <div className="relative flex justify-between md:justify-center md:gap-64">
          {steps.map((step, index) => {
            const isActive = index <= stepIndex
            const isCompleted = index < stepIndex

            return (
              <div key={step.id} className="flex flex-col items-center">
                <span
                  className={`text-xs sm:text-xl font-semibold mb-2 sm:mb-3 transition-colors duration-300 ${
                    isActive ? "text-black" : "text-black/75"
                  }`}
                >
                  {step.label.split('\n').map((line, i) => (
                    <span key={i} className="sm:hidden block text-center">{line}</span>
                  ))}
                  <span className="hidden sm:block">{step.label.replace('\n', ' ')}</span>
                </span>
                <div
                  className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-sac-primary text-white"
                      : "bg-black/5 text-black/50"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <span className="text-sm sm:text-xl">{step.number}</span>
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