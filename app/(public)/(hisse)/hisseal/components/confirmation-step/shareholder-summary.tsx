"use client";

import { Button } from "@/components/ui/button";
import { sacrificeSchema } from "@/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SecurityCodeDialog from "./security-code-dialog";
import TermsAgreementDialog from "./terms-agreement-dialog";
import { ShareholderSummaryCard } from "./shareholder-summary/ShareholderSummaryCard";
import { useShareholderSummaryApproval } from "./shareholder-summary/useShareholderSummaryApproval";

type Step = "selection" | "details" | "confirmation";

interface ShareholderSummaryProps {
  sacrifice: sacrificeSchema | null;
  shareholders: {
    name: string;
    phone: string;
    delivery_location: string;
    second_phone?: string;
    is_purchaser?: boolean;
    paid_amount?: number;
  }[];
  onApprove: () => void;
  setCurrentStep: (step: Step) => void;
  remainingTime: number;
}

export default function ShareholderSummary({
  sacrifice,
  shareholders,
  onApprove,
  setCurrentStep,
}: ShareholderSummaryProps) {
  const {
    showSecurityCodeDialog,
    setShowSecurityCodeDialog,
    showTermsDialog,
    setShowTermsDialog,
    securityCode,
    isProcessing,
    effectivePurchaserIndex,
    handleOpenSecurityCodeDialog,
    handleSecurityCodeSet,
    handleBackToSecurityCode,
    handleTermsConfirm,
  } = useShareholderSummaryApproval(sacrifice, shareholders, onApprove);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full mx-auto">
        {shareholders.map((shareholder, index) => (
          <ShareholderSummaryCard
            key={index}
            shareholder={shareholder}
            sacrifice={sacrifice}
            index={index}
            isPurchaser={index === effectivePurchaserIndex}
            totalShareholders={shareholders.length}
          />
        ))}
      </div>

      <div className="flex justify-between items-center gap-4 w-full max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="bg-sac-red-light hover:bg-sac-red text-sac-red hover:text-white transition-all duration-300 flex items-center justify-center h-10 md:h-12 px-3 md:px-4 flex-1 rounded-md"
          onClick={() => setCurrentStep("details")}
          disabled={isProcessing}
        >
          <ArrowLeft className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 mr-0.5 md:mr-2" />
          <span className="text-[16px] md:text-lg">Hissedar Bilgileri</span>
        </Button>

        <Button
          variant="ghost"
          className="bg-sac-primary-lightest hover:bg-primary text-primary hover:text-white transition-all duration-300 flex items-center justify-center h-10 md:h-12 px-3 md:px-4 flex-1 rounded-md"
          onClick={handleOpenSecurityCodeDialog}
          disabled={isProcessing}
        >
          <span className="text-[16px] md:text-lg">Hisseleri Onayla</span>
          <ArrowRight className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 ml-0.5 md:ml-2" />
        </Button>
      </div>

      <SecurityCodeDialog
        open={showSecurityCodeDialog}
        onOpenChange={setShowSecurityCodeDialog}
        onSecurityCodeSet={handleSecurityCodeSet}
        initialCode={securityCode}
      />

      <TermsAgreementDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onConfirm={handleTermsConfirm}
        onBackToSecurityCode={handleBackToSecurityCode}
        securityCode={securityCode}
      />
    </div>
  );
}
