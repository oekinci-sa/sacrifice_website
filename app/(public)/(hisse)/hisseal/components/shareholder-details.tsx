import { Button } from "@/components/ui/button"
import { sacrificeSchema } from "@/types"
import SacrificeInfo from "./sacrifice-info"
import { ArrowLeft, ArrowRight, Plus } from "lucide-react"
import { useEffect } from "react"

export default function ShareholderDetails({
  sacrifice,
  shareholders,
  onAddShareholder,
  setCurrentStep,
  remainingTime,
  setRemainingTime,
}: ShareholderDetailsProps) {
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 0) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [setRemainingTime])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg">Hisse Seçimi</span>
          <Button
            variant="ghost"
            className="bg-[#FCEFEF] hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 flex items-center justify-center h-10 w-10 rounded-full"
            onClick={() => setCurrentStep("selection")}
          >
            <ArrowLeft className="h-12 w-12" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300 flex items-center justify-center h-10 w-10 rounded-full"
            onClick={() => setCurrentStep("confirmation")}
          >
            <ArrowRight className="h-12 w-12" />
          </Button>
          <span className="text-lg">Hissedar Bilgileri</span>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <SacrificeInfo sacrifice={sacrifice} />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold">
          Hissedarlar ({shareholders.length})
        </div>
        <Button
          onClick={onAddShareholder}
          className="bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300"
          disabled={shareholders.length >= 7}
        >
          <Plus className="h-5 w-5 mr-2" />
          Yeni Hisse Ekle
        </Button>
      </div>

      {/* ... rest of the existing code ... */}
    </div>
  )
} 