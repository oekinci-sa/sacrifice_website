"use client";

import { useToast } from "@/components/ui/use-toast";
import { usePublicYearStore } from "@/stores/only-public-pages/usePublicYearStore";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { SACRIFICE_UPDATED_EVENT } from "@/stores/global/useSacrificeStore";
import { sacrificeSchema } from "@/types";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { FilteredSacrificesContent } from "./components/process-state/FilteredSacrificesContent";
import { PageLayout } from "./components/layout/page-layout";
import { ActiveReservationsInitializer, columns } from "./components/table-step/columns";
import { useHissealPageHandlers } from "./hooks/useHissealPageHandlers";
import { usePageInitialization } from "./hooks/usePageInitialization";
import { usePageLifecycle } from "./hooks/usePageLifecycle";
import { useReservationAndWarningManager } from "./hooks/useReservationAndWarningManager";

const Page = () => {
  const { toast } = useToast();
  const { selectedYear } = usePublicYearStore();
  const pathname = usePathname();
  const router = useRouter();

  // Use ref to track if we need to force UI rerender
  const needsRerender = useRef(false);

  // Initialize page data, stores and queries
  const {
    sacrifices,
    isLoadingSacrifices,
    isRefetching,
    refetchSacrifices,
    selectedSacrifice,
    tempSelectedSacrifice,
    formData,
    currentStep,
    tabValue,
    isSuccess,
    hasNavigatedAway,
    setSelectedSacrifice,
    setTempSelectedSacrifice,
    setFormData,
    goToStep,
    resetStore,
    setSuccess,
    setHasNavigatedAway,
    transaction_id,
    generateNewTransactionId,
    updateShareCount,
    createShareholders,
    createReservation,
    reservationStatus,
    shouldCheckStatus,
    isLoading
  } = usePageInitialization();

  // URL'den gelen fiyat filtresi için state
  const [filteredSacrifices, setFilteredSacrifices] = useState<sacrificeSchema[]>([]);

  // Veri ilk yüklendiğinde manuel olarak bir kez refetch yapalım
  const initialFetchPerformed = useRef(false);
  const lastFetchedYearRef = useRef<number | null>(null);

  useEffect(() => {

    // Check if we've already done the initial fetch
    if (!initialFetchPerformed.current) {
      // Eğer veriler zaten yüklenmişse, bunları yeni filtrelenecek komponent işleyecek
      if (sacrifices.length === 0 && !isLoadingSacrifices && !isRefetching) {
        initialFetchPerformed.current = true;
        lastFetchedYearRef.current = selectedYear;
        refetchSacrifices(selectedYear ?? undefined).then(() => {
        }).catch(err => {
          console.error("Page.tsx: Manuel refetch hatası:", err);
          // Reset the flag if there was an error so we can retry
          initialFetchPerformed.current = false;
        });
      } else {
        // Data is already loaded or being loaded
        initialFetchPerformed.current = true;
      }
    }
  }, [sacrifices.length, isLoadingSacrifices, isRefetching, refetchSacrifices, selectedYear]);

  // URL'deki ?year= değiştiğinde yeniden yükle (ilk yüklemeden sonra)
  useEffect(() => {
    if (selectedYear != null && initialFetchPerformed.current && lastFetchedYearRef.current !== selectedYear) {
      lastFetchedYearRef.current = selectedYear;
      refetchSacrifices(selectedYear).catch(console.error);
    }
  }, [selectedYear, refetchSacrifices]);

  // Realtime subscription ve veri yenileme için useEffect
  useEffect(() => {

    // Sadece yüklenen veriler için filtreleme işlemini yapacak event listener'ı kuralım
    const handleDataUpdate = () => {
      // Actual filtering will be handled by the FilteredSacrificesContent component
    };

    // Event listener ekle
    window.addEventListener(SACRIFICE_UPDATED_EVENT, handleDataUpdate);

    // Temizleme fonksiyonu
    return () => {
      window.removeEventListener(SACRIFICE_UPDATED_EVENT, handleDataUpdate);
    };
  }, []);

  const handleTimeoutRedirect = useCallback(async () => {
    const tid = useReservationIDStore.getState().transaction_id;
    if (tid) {
      try {
        await fetch('/api/expire-reservation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_id: tid, status: 'timed_out' }),
        });
      } catch {
        // Best-effort — DB cron will catch it anyway
      }
    }

    resetStore();
    generateNewTransactionId();
    goToStep("selection");
    needsRerender.current = true;
    router.refresh();
    try {
      const sacrifices = await refetchSacrifices(selectedYear ?? undefined);
      return { data: sacrifices, success: true };
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }, [resetStore, generateNewTransactionId, goToStep, refetchSacrifices, router, selectedYear]);

  const {
    isDialogOpen,
    setIsDialogOpen,
    timeLeft,
    lastInteractionTime,
    setLastInteractionTime,
    showWarning,
    setShowWarning,
    inactivitySecondsLeft,
    setInactivitySecondsLeft,
    isReservationLoading,
    showReservationInfo,
    setShowReservationInfo,
    cameFromTimeout,
    setCameFromTimeout,
    showThreeMinuteWarning,
    setShowThreeMinuteWarning,
    showOneMinuteWarning,
    setShowOneMinuteWarning,
    getRemainingMinutesText,
    handleDismissWarning,
    INACTIVITY_TIMEOUT,
    INACTIVITY_WARNING_THRESHOLD
  } = useReservationAndWarningManager({
    transactionId: transaction_id,
    reservationStatus,
    shouldCheckStatus,
    createReservation,
    handleTimeoutRedirect,
    toast
  });

  const handleFilteredSacrificesChange = useCallback((data: sacrificeSchema[]) => {
    setFilteredSacrifices(data);
  }, []);

  const {
    handleSacrificeSelect,
    handleShareCountSelect,
    handleReservationInfoClose,
    handleApprove,
    handlePdfDownload,
    handleCustomTimeoutWithPromise,
    refetchSacrificesWrapper,
    handleUpdateShareCount,
    handleDismissWarningWrapper,
  } = useHissealPageHandlers({
    setCameFromTimeout,
    needsRerender,
    generateNewTransactionId,
    setTempSelectedSacrifice,
    setIsDialogOpen,
    tempSelectedSacrifice,
    updateShareCount,
    setSelectedSacrifice,
    setFormData,
    goToStep,
    setLastInteractionTime,
    transaction_id,
    createReservation,
    setShowReservationInfo,
    selectedSacrifice,
    formData,
    createShareholders,
    setSuccess,
    resetStore,
    refetchSacrifices,
    setShowWarning,
    setShowThreeMinuteWarning,
    setShowOneMinuteWarning,
    handleDismissWarning,
    performRedirect: handleTimeoutRedirect,
  });

  // Apply page lifecycle hooks but avoid circular dependencies
  usePageLifecycle({
    pathname,
    resetStore,
    goToStep,
    setSuccess,
    setHasNavigatedAway,
    refetchSacrifices: refetchSacrificesWrapper,
    isSuccess,
    hasNavigatedAway,
    currentStep,
    transaction_id,
    selectedSacrifice,
    formData,
    updateShareCount,
    sacrifices,
    isLoadingSacrifices,
    isRefetching,
    generateNewTransactionId,
    needsRerender,
    isDialogOpen,
    setIsDialogOpen,
    lastInteractionTime,
    setLastInteractionTime,
    showWarning,
    setShowWarning,
    setInactivitySecondsLeft,
    showReservationInfo,
    setShowReservationInfo,
    showThreeMinuteWarning,
    setShowThreeMinuteWarning,
    showOneMinuteWarning,
    setShowOneMinuteWarning,
    cameFromTimeout,
    setCameFromTimeout,
    INACTIVITY_TIMEOUT,
    INACTIVITY_WARNING_THRESHOLD,
    handleCustomTimeout: handleCustomTimeoutWithPromise,
    toast,
  });

  // Add a debug utility to test expire-reservation API (DEV only)
  // This exposes a method that can be called from the browser console for testing
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // @ts-expect-error - Deliberately adding to window for debugging
    window.testExpireReservation = (testId?: string) => {
      const idToUse = testId || transaction_id;

      fetch('/api/expire-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id: idToUse }),
      })
        .then(response => response.json())
        .then(data => {
          toast({
            title: 'API Test Result',
            description: `Status: ${data.message || data.error || 'Unknown'}`
          });
        })
        .catch(err => {
          toast({
            variant: 'destructive',
            title: 'API Test Failed',
            description: err.message
          });
        });
    };
  }

  return (
    <>
      {/* Wrap the component using useSearchParams in Suspense */}
      <Suspense fallback={null}>
        <FilteredSacrificesContent
          sacrifices={sacrifices}
          onFilteredSacrificesChange={handleFilteredSacrificesChange}
        />
      </Suspense>

      {/* Aktif rezervasyonları izleyen bileşen */}
      <ActiveReservationsInitializer />

      <PageLayout
        isSuccess={isSuccess}
        onPdfDownload={handlePdfDownload}
        currentStep={currentStep}
        tabValue={tabValue}
        timeLeft={timeLeft}
        showWarning={showWarning}
        showInactivityWarning={showWarning}
        inactivitySecondsLeft={inactivitySecondsLeft}
        columns={columns}
        data={filteredSacrifices}
        selectedSacrifice={selectedSacrifice}
        formData={formData}
        onSacrificeSelect={handleSacrificeSelect}
        updateShareCount={handleUpdateShareCount}
        setFormData={setFormData}
        goToStep={goToStep}
        resetStore={resetStore}
        setLastInteractionTime={setLastInteractionTime}
        handleApprove={handleApprove}
        toast={toast}
        tempSelectedSacrifice={tempSelectedSacrifice}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        showReservationInfo={showReservationInfo}
        setShowReservationInfo={setShowReservationInfo}
        showThreeMinuteWarning={showThreeMinuteWarning}
        setShowThreeMinuteWarning={setShowThreeMinuteWarning}
        showOneMinuteWarning={showOneMinuteWarning}
        setShowOneMinuteWarning={setShowOneMinuteWarning}
        handleShareCountSelect={handleShareCountSelect}
        handleReservationInfoClose={handleReservationInfoClose}
        handleDismissWarning={handleDismissWarningWrapper}
        getRemainingMinutesText={getRemainingMinutesText}
        isReservationLoading={isReservationLoading}
        isLoading={isLoading}
        oneMinuteCountdown={showOneMinuteWarning ? timeLeft : undefined}
      />
    </>
  );
};

export default Page;
