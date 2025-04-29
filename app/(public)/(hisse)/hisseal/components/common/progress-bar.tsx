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
    <div className="mx-auto">
      {/* Steps */}
      <div className="flex gap-16 md:gap-40">
        {steps.map((step, index) => {
          const isActive = index <= stepIndex
          const isCompleted = index < stepIndex

          return (
            // Step container
            <div key={step.id} className="flex flex-col items-center">

              {/* Step label */}
              <span
                className={`text-base md:text-xl font-semibold mb-4 transition-colors duration-300 ${isActive ? "text-black" : "text-black/75"
                  }`}
              >
                {step.label.split('\n').map((line, i) => (
                  <span key={i} className="md:hidden block text-center">{line}</span>
                ))}
                <span className="hidden md:block">{step.label.replace('\n', ' ')}</span>
              </span>

              {/* Step number */}
              <div
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${isActive
                  ? "bg-sac-primary text-white"
                  : "bg-black/5 text-black/50"
                  }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <span className="text-lg md:text-xl">{step.number}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 