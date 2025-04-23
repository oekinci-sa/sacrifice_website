"use client";

import { useToast } from "@/components/ui/use-toast";
import { SACRIFICE_UPDATED_EVENT } from "@/stores/global/useSacrificeStore";
import { SacrificeQueryResult, sacrificeSchema } from "@/types";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { PageLayout } from "./components/layout/page-layout";
import { columns } from "./components/table-step/columns";
import {
  createHandleApprove,
  createHandlePdfDownload,
  createHandleReservationInfoClose,
  createHandleSacrificeSelect,
  createHandleShareCountSelect
} from "./handlers/share-selection-handlers";
import { createHandleCustomTimeout } from "./handlers/timeout-handlers";
import { usePageInitialization } from "./hooks/usePageInitialization";
import { usePageLifecycle } from "./hooks/usePageLifecycle";
import { useReservationAndWarningManager } from "./hooks/useReservationAndWarningManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Client component that uses useSearchParams
function FilteredSacrificesContent({
  sacrifices,
  onFilteredSacrificesChange
}: {
  sacrifices: sacrificeSchema[],
  onFilteredSacrificesChange: (data: sacrificeSchema[]) => void
}) {
  const searchParams = useSearchParams();
  const priceParam = searchParams.get('price');

  // Apply filtering when sacrifices or priceParam changes
  useEffect(() => {
    console.log("FilteredSacrificesContent: Filtering with price param:", priceParam);
    if (sacrifices.length === 0) return;

    if (priceParam && !isNaN(Number(priceParam))) {
      const price = Number(priceParam);
      onFilteredSacrificesChange(sacrifices.filter(sacrifice => sacrifice.share_price === price));
    } else {
      onFilteredSacrificesChange([...sacrifices]);
    }
  }, [sacrifices, priceParam, onFilteredSacrificesChange]);

  return null; // This component doesn't render anything, just handles the filtering
}

const Page = () => {
  const { toast } = useToast();
  const pathname = usePathname();
  // Remove useSearchParams from here - moved to FilteredSacrificesContent

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
  useEffect(() => {
    console.log("Page.tsx: İlk yükleme kontrolü, mevcut veri sayısı:", sacrifices.length);

    // Eğer veriler zaten yüklenmişse, bunları yeni filtrelenecek komponent işleyecek
    if (sacrifices.length === 0 && !isLoadingSacrifices && !isRefetching) {
      console.log("Page.tsx: Veriler mevcut değil, manuel refetch yapılıyor");
      refetchSacrifices().then(data => {
        console.log("Page.tsx: Manuel refetch tamamlandı, veri sayısı:", data.length);
      }).catch(err => {
        console.error("Page.tsx: Manuel refetch hatası:", err);
      });
    }
  }, []); // Sadece bir kez çalışsın

  // Realtime subscription ve veri yenileme için useEffect
  useEffect(() => {
    console.log("Page.tsx: Realtime aboneliği ve veri dinleyicileri kuruluyor...");

    // Sadece yüklenen veriler için filtreleme işlemini yapacak event listener'ı kuralım
    const handleDataUpdate = () => {
      console.log("Page.tsx: SACRIFICE_UPDATED_EVENT alındı, filteredSacrifices güncellenmesi gerekecek");
      // Actual filtering will be handled by the FilteredSacrificesContent component
    };

    // Event listener ekle
    window.addEventListener(SACRIFICE_UPDATED_EVENT, handleDataUpdate);

    // Temizleme fonksiyonu
    return () => {
      console.log("Page.tsx: Event listener temizleniyor...");
      window.removeEventListener(SACRIFICE_UPDATED_EVENT, handleDataUpdate);
    };
  }, []);

  // Create key handlers directly in the component to avoid circular dependencies
  const handleTimeoutRedirect = useCallback(async () => {
    resetStore();
    goToStep("selection");
    needsRerender.current = true;
    try {
      const sacrifices = await refetchSacrifices();
      // Return a SacrificeQueryResult object instead of using the array directly
      return {
        data: sacrifices,
        success: true
      };
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }, [resetStore, goToStep, refetchSacrifices]);

  // Use our custom hook for reservation and warning management
  const {
    isDialogOpen,
    setIsDialogOpen,
    timeLeft,
    setTimeLeft,
    lastInteractionTime,
    setLastInteractionTime,
    showWarning,
    setShowWarning,
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
    fetchReservationExpiry,
    TIMEOUT_DURATION,
    WARNING_THRESHOLD
  } = useReservationAndWarningManager({
    reservationStatus,
    shouldCheckStatus,
    createReservation,
    handleTimeoutRedirect,
    toast
  });

  // Callback for updating filtered sacrifices from the FilteredSacrificesContent
  const handleFilteredSacrificesChange = useCallback((data: sacrificeSchema[]) => {
    setFilteredSacrifices(data);
  }, []);

  // Create action handlers
  const handleSacrificeSelect = createHandleSacrificeSelect({
    setCameFromTimeout,
    needsRerender,
    setTempSelectedSacrifice,
    setIsDialogOpen
  });

  const handleShareCountSelect = createHandleShareCountSelect({
    tempSelectedSacrifice,
    updateShareCount,
    setSelectedSacrifice,
    setFormData,
    goToStep,
    setIsDialogOpen,
    setLastInteractionTime,
    toast,
    transaction_id,
    createReservation,
    setShowReservationInfo
  });

  const handleReservationInfoClose = createHandleReservationInfoClose(
    setShowReservationInfo
  );

  const handleApprove = createHandleApprove({
    selectedSacrifice,
    formData,
    createShareholders,
    setSuccess,
    goToStep,
    toast,
    transaction_id
  });

  const handlePdfDownload = createHandlePdfDownload();

  // Create custom timeout handler
  const handleCustomTimeout = createHandleCustomTimeout({
    resetStore,
    goToStep,
    toast,
    refetchSacrifices: async (): Promise<SacrificeQueryResult> => {
      try {
        const sacrifices = await refetchSacrifices();
        // Wrap the sacrifices array in a SacrificeQueryResult
        return {
          data: sacrifices,
          success: true
        };
      } catch (error) {
        // Return a failed result object instead of void
        return {
          data: undefined,
          success: false,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    },
    transaction_id,
    setShowWarning,
    setIsDialogOpen,
    setShowReservationInfo,
    setShowThreeMinuteWarning,
    setShowOneMinuteWarning,
    setCameFromTimeout,
    needsRerender
  });

  // Create a promise-returning version for the lifecycle
  const handleCustomTimeoutWithPromise = useCallback(async () => {
    return await handleCustomTimeout();
  }, [handleCustomTimeout]);

  // Check for reservation status when transaction_id changes
  useEffect(() => {
    if (transaction_id && currentStep === "details") {
      // Fetch the reservation expiry time from server
      fetchReservationExpiry(transaction_id).then(expiryData => {
        if (expiryData && expiryData.timeLeftSeconds <= 0) {
          // If expired, redirect to selection
          toast({
            variant: "destructive",
            title: "Rezervasyon Süresi Doldu",
            description: "Rezervasyon süreniz dolmuş. Lütfen tekrar hisse seçiniz."
          });

          handleCustomTimeout();
        }
      });
    }
  }, [transaction_id, currentStep, fetchReservationExpiry, toast, handleCustomTimeout]);

  // Safe server time remaining
  const safeServerTimeRemaining = reservationStatus?.timeRemaining || undefined;

  // Create a refetchSacrifices wrapper that returns SacrificeQueryResult
  const refetchSacrificesWrapper = useCallback(async (): Promise<SacrificeQueryResult> => {
    try {
      const sacrifices = await refetchSacrifices();
      return {
        data: sacrifices,
        success: true
      };
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }, [refetchSacrifices]);

  // Function to update share count in a type-safe way
  const handleUpdateShareCount = async (count: number) => {
    try {
      if (updateShareCount && typeof updateShareCount.mutateAsync === 'function') {
        await updateShareCount.mutateAsync({
          transaction_id,
          share_count: count,
          operation: 'add'
        });
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Sistem hatası: Hisse güncellemesi yapılamıyor."
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hisse sayısı güncellenirken bir sorun oluştu."
      });
    }
  };

  // Wrapper for dismiss warning to match expected signature
  const handleDismissWarningWrapper = (warningType: "three-minute" | "one-minute" = "three-minute") => {
    handleDismissWarning(warningType);
  };

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
    setTimeLeft,
    showReservationInfo,
    setShowReservationInfo,
    showThreeMinuteWarning,
    setShowThreeMinuteWarning,
    showOneMinuteWarning,
    setShowOneMinuteWarning,
    cameFromTimeout,
    setCameFromTimeout,
    TIMEOUT_DURATION,
    WARNING_THRESHOLD,
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

      <PageLayout
        isSuccess={isSuccess}
        onPdfDownload={handlePdfDownload}
        currentStep={currentStep}
        tabValue={tabValue}
        timeLeft={timeLeft}
        showWarning={showWarning}
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
        setTimeLeft={setTimeLeft}
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
        serverTimeRemaining={safeServerTimeRemaining}
      />
    </>
  );
};

export default Page;
