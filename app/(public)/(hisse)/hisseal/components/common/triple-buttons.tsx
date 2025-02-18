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
  onBack: () => void;
  onContinue: () => void;
  onAddShareholder?: () => void;
  canAddShareholder?: boolean;
  isAddingShare?: boolean;
  isUpdatePending?: boolean;
  maxShareholderReached?: boolean;
}

export default function TripleButtons({
  onBack,
  onContinue,
  onAddShareholder,
  canAddShareholder = false,
  isAddingShare = false,
  isUpdatePending = false,
  maxShareholderReached = false,
}: TripleButtonsProps) {
  return (
    <div className="flex justify-center items-center gap-2 sm:gap-4 pt-6">
      <Button
        variant="ghost"
        className="rounded-full bg-[#FCEFEF] hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 flex items-center justify-center h-8 sm:h-10 px-3 sm:px-4 min-w-[100px] sm:min-w-[140px]"
        onClick={onBack}
      >
        <ArrowLeft className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-2" />
        <span className="text-xs sm:text-base">Geri Dön</span>
      </Button>

      {onAddShareholder && (
        <div className="mx-2 sm:mx-4">
          {(!canAddShareholder || maxShareholderReached || isAddingShare || isUpdatePending) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={onAddShareholder}
                      variant="outline"
                      className="rounded-full bg-sac-primary text-white hover:text-white hover:bg-sac-primary/90 transition-all duration-300 border-0 disabled:bg-[#7FB69B] disabled:text-white/70 disabled:cursor-not-allowed h-8 sm:h-10 px-2 sm:px-4 sm:min-w-[140px] text-xs sm:text-base whitespace-nowrap"
                      disabled={true}
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="opacity-70">
                        <span className="sm:hidden">Yeni</span>
                        <span className="hidden sm:inline">Yeni Hissedar Ekle</span>
                      </span>
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
              className="rounded-full bg-sac-primary text-white hover:text-white hover:bg-sac-primary/90 transition-all duration-300 border-0 h-8 sm:h-10 px-4 sm:px-4 sm:min-w-[140px] text-xs sm:text-base whitespace-nowrap"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="sm:hidden">Yeni Ekle</span>
              <span className="hidden sm:inline">Yeni Hissedar Ekle</span>
            </Button>
          )}
        </div>
      )}

      <Button
        variant="ghost"
        className="rounded-full bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300 flex items-center justify-center h-8 sm:h-10 px-3 sm:px-4 min-w-[100px] sm:min-w-[140px]"
        onClick={onContinue}
      >
        <span className="text-xs sm:text-base">Devam Et</span>
        <ArrowRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 ml-0.5 sm:ml-2" />
      </Button>
    </div>
  )
} 