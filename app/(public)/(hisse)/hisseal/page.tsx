"use client";

import { useToast } from "@/components/ui/use-toast";
import { SacrificeQueryResult } from "@/types";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";
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

const Page = () => {
  const { toast } = useToast();
  const pathname = usePathname();

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

  // Create key handlers directly in the component to avoid circular dependencies
  const handleTimeoutRedirect = useCallback(async () => {
    resetStore();
    goToStep("selection");
    needsRerender.current = true;
    try {
      // Use a local variable to prevent cascading state updates from the result
      const result = await refetchSacrifices();
      // Don't do anything with the result that might trigger re-renders
    } catch (error) {
      console.error("Error refetching sacrifices:", error);
    }
    return Promise.resolve();
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
    TIMEOUT_DURATION,
    WARNING_THRESHOLD
  } = useReservationAndWarningManager({
    reservationStatus,
    shouldCheckStatus,
    createReservation,
    handleTimeoutRedirect,
    toast
  });

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

  // Create custom timeout handler with memoization
  const memoizedHandleCustomTimeout = useMemo(() => createHandleCustomTimeout({
    resetStore,
    goToStep,
    toast,
    refetchSacrifices: async (): Promise<SacrificeQueryResult> => {
      try {
        // Use a local variable to prevent cascading updates
        const result = await refetchSacrifices();
        // Convert the result type to match SacrificeQueryResult
        return {
          data: result,
          success: Array.isArray(result),
          error: Array.isArray(result) ? null : new Error("Failed to fetch sacrifices")
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
  }), [
    resetStore,
    goToStep,
    toast,
    refetchSacrifices,
    transaction_id,
    setShowWarning,
    setIsDialogOpen,
    setShowReservationInfo,
    setShowThreeMinuteWarning,
    setShowOneMinuteWarning,
    setCameFromTimeout
  ]);

  // Create a promise-returning version for the lifecycle
  const handleCustomTimeoutWithPromise = useCallback(async () => {
    return await memoizedHandleCustomTimeout();
  }, [memoizedHandleCustomTimeout]);

  // Safe server time remaining
  const safeServerTimeRemaining = reservationStatus?.timeRemaining || undefined;

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

  // Create the refetchSacrifices wrapper with memoization to ensure stability
  const memoizedRefetchSacrificesWrapper = useCallback(async () => {
    // Wrap the refetchSacrifices call to match the expected return type
    try {
      const result = await refetchSacrifices();
      return {
        data: result,
        success: true,
        error: null
      } as SacrificeQueryResult;
    } catch (error) {
      console.error("Error in refetchSacrifices:", error);
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      } as SacrificeQueryResult;
    }
  }, [refetchSacrifices]);

  // Apply page lifecycle hooks but avoid circular dependencies
  usePageLifecycle({
    pathname,
    resetStore,
    goToStep,
    setSuccess,
    setHasNavigatedAway,
    refetchSacrifices: memoizedRefetchSacrificesWrapper,
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
    toast
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
    <PageLayout
      // Success state
      isSuccess={isSuccess}
      onPdfDownload={handlePdfDownload}

      // Form state
      currentStep={currentStep}
      tabValue={tabValue}
      timeLeft={timeLeft}
      showWarning={showWarning}
      columns={columns}
      data={sacrifices}
      selectedSacrifice={selectedSacrifice}
      formData={formData}
      isLoading={isLoading || isReservationLoading}
      serverTimeRemaining={safeServerTimeRemaining}

      // Form handlers
      onSacrificeSelect={handleSacrificeSelect}
      updateShareCount={handleUpdateShareCount}
      setFormData={setFormData}
      goToStep={goToStep}
      resetStore={resetStore}
      setLastInteractionTime={setLastInteractionTime}
      setTimeLeft={setTimeLeft}
      handleApprove={handleApprove}
      toast={toast}

      // Dialog states
      tempSelectedSacrifice={tempSelectedSacrifice}
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      showReservationInfo={showReservationInfo}
      setShowReservationInfo={setShowReservationInfo}
      showThreeMinuteWarning={showThreeMinuteWarning}
      setShowThreeMinuteWarning={setShowThreeMinuteWarning}
      showOneMinuteWarning={showOneMinuteWarning}
      setShowOneMinuteWarning={setShowOneMinuteWarning}

      // Dialog handlers
      handleShareCountSelect={handleShareCountSelect}
      handleReservationInfoClose={handleReservationInfoClose}
      handleDismissWarning={handleDismissWarningWrapper}
      getRemainingMinutesText={getRemainingMinutesText}
      isReservationLoading={isReservationLoading}
    />
  );
};

export default Page;
