"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, usePathname } from "next/navigation";
import { useHisseStore } from "@/stores/useHisseStore";
import { useReservationStore } from "@/stores/useReservationStore";
import {
  useSacrifices,
} from "@/hooks/useSacrifices";
import { useCreateShareholders } from "@/hooks/useShareholders";
import { useCreateReservation, useUpdateShareCount } from "@/hooks/useReservations";
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

const TIMEOUT_DURATION = 120; // 3 minutes
const WARNING_THRESHOLD = 5; // Show warning at 1 minute

const Page = () => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [isReservationLoading, setIsReservationLoading] = useState(false);

  // Zustand stores
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
  
  // Reservation store - transaction_id yönetimi
  const { transaction_id, generateNewTransactionId } = useReservationStore();

  // React Query hooks
  const { data = [] } = useSacrifices();
  const updateShareCount = useUpdateShareCount();
  const createShareholders = useCreateShareholders();
  const createReservation = useCreateReservation();

  // Rezervasyon işlemi sırasında yükleniyor durumunu yönet
  useEffect(() => {
    // En basit ve güvenli kontrole dönelim - any type kullanarak
    try {
      // @ts-ignore - React Query'nin versiyona göre değişen yapısını ele almak için
      const isLoading = createReservation.isPending || createReservation.isLoading || createReservation.isFetching || false;
      if (isLoading) {
        setIsReservationLoading(true);
      } else {
        // Kısa bir gecikme ile yükleniyor durumunu kaldır (UI geçişi için)
        const timer = setTimeout(() => setIsReservationLoading(false), 300);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      // Herhangi bir hata durumunda, yükleme durumunu kapat
      console.warn('React Query yükleme durumu kontrol edilemedi:', error);
      setIsReservationLoading(false);
    }
  }, [createReservation]);

  // Reset form state when entering the page
  useEffect(() => {
    if (pathname === "/hisseal") {
      resetStore();
      goToStep("selection");
      // Yeni bir transaction_id oluştur
      generateNewTransactionId();
      
      // Console'a transaction_id değerini ve uzunluğunu logla (debug için)
      console.log('Generated new transaction_id:', {
        id: useReservationStore.getState().transaction_id,
        length: useReservationStore.getState().transaction_id.length
      });
    }
  }, [pathname, resetStore, goToStep, generateNewTransactionId]);

  // Handle navigation changes
  useHandleNavigationHistory({
    currentStep,
    selectedSacrifice,
    formData,
    updateShareCount,
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
    updateShareCount,
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
    setIsReservationLoading(true);
    try {
      await helperHandleShareCountSelect({
        shareCount,
        tempSelectedSacrifice,
        updateShareCount,
        setSelectedSacrifice,
        setFormData,
        goToStep,
        setIsDialogOpen,
        setLastInteractionTime,
        toast,
        transaction_id,
        createReservation
      });
    } catch (error) {
      console.error('Error in handleShareCountSelect:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
      });
    } finally {
      // Hata olsa bile yükleniyor durumunu kaldır
      setTimeout(() => setIsReservationLoading(false), 300);
    }
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
          updateShareCount={updateShareCount}
          setFormData={setFormData}
          goToStep={goToStep}
          resetStore={resetStore}
          setLastInteractionTime={setLastInteractionTime}
          setTimeLeft={setTimeLeft}
          handleApprove={handleApprove}
          toast={toast}
          isLoading={isReservationLoading}
        />
      )}

      {tempSelectedSacrifice && (
        <ShareSelectDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          sacrifice={tempSelectedSacrifice}
          onSelect={handleShareCountSelect}
          isLoading={isReservationLoading}
        />
      )}
    </div>
  );
};

export default Page;
