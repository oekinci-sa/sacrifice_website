"use client"

import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, ArrowRight } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TripleButtonsProps {
  onBack: () => void
  onContinue: () => void
  onAddShareholder?: () => void
  canAddShareholder?: boolean
  isAddingShare?: boolean
  isUpdatePending?: boolean
  maxShareholderReached?: boolean
}

export default function ProgressNav({
  onBack,
  onContinue,
  onAddShareholder,
  canAddShareholder = false,
  isAddingShare = false,
  isUpdatePending = false,
  maxShareholderReached = false,
}: ProgressNavProps) {
  return (
    <div className="flex justify-center items-center gap-4 pt-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">Geri Dön</span>
        <Button
          variant="ghost"
          className="bg-[#FCEFEF] hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 flex items-center justify-center h-10 w-10 rounded-full"
          onClick={onBack}
        >
          <ArrowLeft className="h-12 w-12" />
        </Button>
      </div>

      {onAddShareholder && (
        <div className="flex items-center gap-2 mx-4">
          {(!canAddShareholder || maxShareholderReached || isAddingShare || isUpdatePending) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={onAddShareholder}
                      variant="outline"
                      className="rounded-full bg-sac-primary text-white hover:text-white hover:bg-sac-primary/90 transition-all duration-300 border-0 disabled:bg-[#7FB69B] disabled:text-white/70 disabled:cursor-not-allowed"
                      disabled={true}
                    >
                      <Plus className="h-5 w-5 mr-2 opacity-70" />
                      <span className="opacity-70">Yeni Hissedar Ekle</span>
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {maxShareholderReached ? "Maksimum hissedar sayısına ulaşıldı." : !canAddShareholder ? "Boş hisse kalmadı." : ""}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              onClick={onAddShareholder}
              variant="outline"
              className="rounded-full bg-sac-primary text-white hover:text-white hover:bg-sac-primary/90 transition-all duration-300 border-0"
            >
              <Plus className="h-5 w-5 mr-2" />
              Yeni Hissedar Ekle
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300 flex items-center justify-center h-10 w-10 rounded-full"
          onClick={onContinue}
        >
          <ArrowRight className="h-12 w-12" />
        </Button>
        <span className="text-lg">Devam Et</span>
      </div>
    </div>
  )
} 