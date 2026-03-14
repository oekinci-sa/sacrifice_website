"use client";

import { useEffect } from "react";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useShareSelectionFlowStore } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import TripleButtons from "../common/triple-buttons";
import SacrificeInfo from "./sacrifice-info";
import ShareholderForm from "./shareholder-form";
import { CheckoutDialogs } from "./checkout/CheckoutDialogs";
import { useCheckoutForm } from "./checkout/useCheckoutForm";

interface CheckoutProps {
  onApprove: () => void;
  onBack: (shareCount: number) => void;
  setLastInteractionTime: (time: number) => void;
}

export default function Checkout({
  onBack,
  setLastInteractionTime,
}: CheckoutProps) {
  const { refetchSacrifices } = useSacrificeStore();
  const { selectedSacrifice, formData } = useShareSelectionFlowStore();

  const {
    errors,
    extendedFormData,
    currentSacrifice,
    showBackDialog,
    setShowBackDialog,
    showLastShareDialog,
    setShowLastShareDialog,
    isAddingShare,
    isCanceling,
    cancelReservation,
    updateShareCount,
    handleInputChange,
    handleInputBlur,
    handleSelectChange,
    handleIsPurchaserChange,
    handleAddShareholder,
    handleRemoveShareholder,
    confirmBack,
    cancelBack,
    handleLastShareAction,
    handleContinue,
  } = useCheckoutForm(setLastInteractionTime, onBack);

  useEffect(() => {
    refetchSacrifices();
  }, [refetchSacrifices]);

  useEffect(() => {
    refetchSacrifices();
  }, [formData.length, refetchSacrifices]);

  return (
    <div className="space-y-8 md:space-y-16">
      <div className="w-full">
        <SacrificeInfo sacrifice={selectedSacrifice} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 justify-items-stretch mx-auto">
        {formData.map((data, index) => (
          <div key={index}>
            <ShareholderForm
              data={data}
              index={index}
              errors={errors[index] || {}}
              onInputChange={handleInputChange}
              onInputBlur={handleInputBlur}
              onSelectChange={handleSelectChange}
              onRemove={handleRemoveShareholder}
              onIsPurchaserChange={handleIsPurchaserChange}
              isOtherPurchaserSelected={extendedFormData.some(
                (d, i) => i !== index && d.is_purchaser === true
              )}
              totalForms={formData.length}
            />
          </div>
        ))}
      </div>

      <TripleButtons
        onBack={() => setShowBackDialog(true)}
        onContinue={handleContinue}
        onAddShareholder={handleAddShareholder}
        canAddShareholder={Boolean(
          currentSacrifice?.empty_share && currentSacrifice.empty_share > 0
        )}
        isAddingShare={isAddingShare}
        isUpdatePending={updateShareCount.isPending}
        maxShareholderReached={formData.length >= 7}
      />

      <CheckoutDialogs
        showBackDialog={showBackDialog}
        setShowBackDialog={setShowBackDialog}
        showLastShareDialog={showLastShareDialog}
        setShowLastShareDialog={setShowLastShareDialog}
        isCanceling={isCanceling}
        cancelReservation={cancelReservation}
        confirmBack={confirmBack}
        cancelBack={cancelBack}
        handleLastShareAction={handleLastShareAction}
      />
    </div>
  );
}
