"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, usePathname } from "next/navigation";
import { useHisseStore } from "@/stores/useHisseStore";
import {
  useSacrifices,
  useUpdateSacrifice,
} from "@/hooks/useSacrifices";
import { useCreateShareholders } from "@/hooks/useShareholders";
import { sacrificeSchema } from "@/types";
import { 
  setupNavigationHandler, 
  useHandleInteractionTimeout,
  useTrackInteractions,
  handleShareCountSelect as helperHandleShareCountSelect,
  handleApprove as helperHandleApprove,
  useHandleNavigationHistory,
  useHandlePageUnload
} from "@/helpers/hisseal-helpers";
import { columns } from "./components/table-step/columns";
import { ShareSelectDialog } from "./components/table-step/share-select-dialog";
import { SuccessView } from "./components/success-state/success-view";
import { FormView } from "./components/process-state/form-view";

const TIMEOUT_DURATION = 60; // 3 minutes
const WARNING_THRESHOLD = 30; // Show warning at 1 minute

const Page = () => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);

  // Zustand store
  const {
    selectedSacrifice,
    tempSelectedSacrifice,
    formData,
    currentStep,
    tabValue,
    isSuccess,
    setSelectedSacrifice,
    setTempSelectedSacrifice,
    setFormData,
    goToStep,
    resetStore,
    setSuccess,
  } = useHisseStore();

  // React Query hooks
  const { data = [] } = useSacrifices();
  const updateSacrifice = useUpdateSacrifice();
  const createShareholders = useCreateShareholders();

  // Reset form state when entering the page
  useEffect(() => {
    if (pathname === "/hisseal") {
      resetStore();
      goToStep("selection");
    }
  }, [pathname, resetStore, goToStep]);

  // Handle navigation changes
  useHandleNavigationHistory({
    currentStep,
    selectedSacrifice,
    formData,
    updateSacrifice,
    resetStore,
    goToStep,
    isSuccess,
    toast
  });

  // Handle interaction timeout
  useHandleInteractionTimeout(
    isSuccess,
    currentStep,
    selectedSacrifice,
    formData,
    updateSacrifice,
    goToStep,
    resetStore,
    lastInteractionTime,
    showWarning,
    setShowWarning,
    setTimeLeft,
    TIMEOUT_DURATION,
    WARNING_THRESHOLD
  );

  // Sayfa seviyesinde etkileşimleri takip et
  useTrackInteractions(
    currentStep,
    setLastInteractionTime,
    setShowWarning,
    setTimeLeft,
    TIMEOUT_DURATION
  );

  // Sayfa kapatma/yenileme durumunda DB güncelleme
  useHandlePageUnload({
    currentStep,
    selectedSacrifice,
    formData
  });

  const handleSacrificeSelect = async (sacrifice: sacrificeSchema) => {
    setTempSelectedSacrifice(sacrifice);
    setIsDialogOpen(true);
  };

  const handleShareCountSelect = async (shareCount: number) => {
    await helperHandleShareCountSelect({
      shareCount,
      tempSelectedSacrifice,
      updateSacrifice,
      setSelectedSacrifice,
      setFormData,
      goToStep,
      setIsDialogOpen,
      setLastInteractionTime,
      toast
    });
  };

  const handleApprove = async () => {
    await helperHandleApprove({
      selectedSacrifice,
      formData,
      createShareholders,
      setSuccess,
      goToStep,
      toast
    });
  };

  const handlePdfDownload = () => {
    // PDF indirme işlemi buraya eklenecek
    console.log("PDF indirme işlemi");
  };

  return (
    <div className="container flex flex-col space-y-8">
      {isSuccess ? (
        <SuccessView onPdfDownload={handlePdfDownload} />
      ) : (
        <FormView
          currentStep={currentStep}
          tabValue={tabValue}
          timeLeft={timeLeft}
          showWarning={showWarning}
          columns={columns}
          data={data}
          selectedSacrifice={selectedSacrifice}
          formData={formData}
          onSacrificeSelect={handleSacrificeSelect}
          updateSacrifice={updateSacrifice}
          setFormData={setFormData}
          goToStep={goToStep}
          resetStore={resetStore}
          setLastInteractionTime={setLastInteractionTime}
          setTimeLeft={setTimeLeft}
          handleApprove={handleApprove}
          toast={toast}
        />
      )}

      {tempSelectedSacrifice && (
        <ShareSelectDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          sacrifice={tempSelectedSacrifice}
          onSelect={handleShareCountSelect}
        />
      )}
    </div>
  );
};

export default Page;
