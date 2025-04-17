"use client"

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";

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
    <div className="flex justify-center items-center gap-2 md:gap-4">
      <Button
        variant="ghost"
        className="rounded-full bg-[#FCEFEF] hover:bg-[#D22D2D] text-[#D22D2D] hover:text-white transition-all duration-300 flex items-center justify-center h-8 md:h-10 px-3 md:px-4 min-w-[100px] md:min-w-[140px]"
        onClick={onBack}
      >
        <ArrowLeft className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 mr-0.5 md:mr-2" />
        <span className="text-xs md:text-base">Geri Dön</span>
      </Button>

      {onAddShareholder && (
        <div className="mx-2 md:mx-4">
          {(!canAddShareholder || maxShareholderReached || isAddingShare || isUpdatePending) ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={onAddShareholder}
                      variant="outline"
                      className="rounded-full bg-sac-primary text-white hover:text-white hover:bg-sac-primary/90 transition-all duration-300 border-0 disabled:bg-[#7FB69B] disabled:text-white/70 disabled:cursor-not-allowed h-8 md:h-10 px-2 md:px-4 md:min-w-[140px] text-xs md:text-base whitespace-nowrap"
                      disabled={true}
                    >
                      <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span className="opacity-70">
                        <span className="md:hidden">Yeni</span>
                        <span className="hidden md:inline">Yeni Hissedar Ekle</span>
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
              className="rounded-full bg-sac-primary text-white hover:text-white hover:bg-sac-primary/90 transition-all duration-300 border-0 h-8 md:h-10 px-4 md:px-4 md:min-w-[140px] text-xs md:text-base whitespace-nowrap"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="md:hidden">Yeni Ekle</span>
              <span className="hidden md:inline">Yeni Hissedar Ekle</span>
            </Button>
          )}
        </div>
      )}

      <Button
        variant="ghost"
        className="rounded-full bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white transition-all duration-300 flex items-center justify-center h-8 md:h-10 px-3 md:px-4 min-w-[100px] md:min-w-[140px]"
        onClick={onContinue}
      >
        <span className="text-xs md:text-base">Devam Et</span>
        <ArrowRight className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 ml-0.5 md:ml-2" />
      </Button>
    </div>
  )
} 