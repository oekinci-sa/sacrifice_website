"use client";

import { useToast } from "@/components/ui/use-toast";
import { Step as StoreStep } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { PageLayout } from "./components/layout/page-layout";
import { Step as FormViewStep } from "./components/process-state/form-view";
import { columns } from "./components/table-step/columns";
import {
  createHandlePdfDownload,
  createHandleReservationInfoClose,
  createHandleSacrificeSelect,
  createHandleShareCountSelect
} from "./handlers/share-selection-handlers";
import { createHandleCustomTimeout } from "./handlers/timeout-handlers";
import { usePageInitialization } from "./hooks/usePageInitialization";
import { usePageLifecycle } from "./hooks/usePageLifecycle";
import { useReservationAndWarningManager } from "./hooks/useReservationAndWarningManager";

// Define a proper ShareholderInput type for API submission
interface ShareholderInput {
  shareholder_name: string;
  phone_number: string;
  transaction_id: string;
  sacrifice_id: string;
  share_price: number;
  shares_count: number;
  delivery_location: string;
  delivery_fee?: number; // Optional
  delivery_date: string;
  delivery_address: string;
  delivery_notes: string;
  security_code: string;
  purchased_by: string;
  last_edited_by: string;
  is_purchaser?: boolean; // Optional
  sacrifice_consent?: boolean; // Optional
  total_amount: number;
  remaining_payment: number;
}

// Define types for the reservation and shareholder data
interface ReservationData {
  transaction_id: string;
  sacrifice_id: string;
  share_count: number;
}

interface ReservationResponse {
  success: boolean;
  message: string;
  reservation_id?: string;
}

// Define ShareholderFormData interface to match the type used in form-view.tsx
interface ShareholderFormData {
  name: string;
  phone: string;
  delivery_location: string;
  delivery_fee: number;
  sacrifice_consent: boolean;
  is_purchaser?: boolean;
  paid_amount?: number;
  delivery?: {
    location: string;
    useTeslimat: boolean;
    date: string;
    address: string;
    notes?: string;
  };
  shareholders?: Record<string, {
    name: string;
    phone: string;
    shareCount: number;
  }>;
}

const Page = () => {
  const { toast } = useToast();
  const pathname = usePathname();
  // Add loading state for handleApprove
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Create a string-accepting goToStep wrapper for handlers that handles mapping between different step naming systems
  const goToStepAsString = (step: string) => {
    if (step === "info") {
      goToStep("details" as StoreStep);
    } else if (step === "payment") {
      goToStep("confirmation" as StoreStep);
    } else if (step === "complete" || step === "success") {
      // Now "success" is a valid value for StoreStep
      goToStep("success" as StoreStep);
    } else {
      goToStep(step as StoreStep);
    }
  };

  // Create a wrapper for updateShareCount to resolve type issues
  const updateShareCountWrapper = {
    mutate: (data: { transaction_id: string; share_count: number; operation: 'add' | 'remove' }) => {
      updateShareCount.mutate(data);
      return Promise.resolve({ success: true, message: "Operation successful" });
    },
    reset: updateShareCount.reset
  };

  // Create key handlers directly in the component to avoid circular dependencies
  const handleTimeoutRedirect = useCallback(() => {
    console.log("Timeout occurred, redirecting to selection step");
    resetStore();
    goToStep("selection");
    needsRerender.current = true;
    refetchSacrifices();
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
    createReservation: {
      mutate: async (data: unknown) => {
        return createReservation.mutate(data as ReservationData);
      },
      reset: createReservation.reset,
      isPending: createReservation.isPending,
      // Match the properties according to React Query version
      isLoading: createReservation.isPending
    },
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
    updateShareCount: updateShareCountWrapper,
    setSelectedSacrifice,
    setFormData,
    goToStep: goToStepAsString,
    setIsDialogOpen,
    setLastInteractionTime,
    toast,
    transaction_id,
    createReservation: {
      mutate: async (data: ReservationData): Promise<ReservationResponse> => {
        createReservation.mutate(data);
        return Promise.resolve({ success: true, message: "Reservation created successfully" });
      },
      reset: createReservation.reset,
      isPending: createReservation.isPending,
      // Match the properties according to React Query version
      isLoading: createReservation.isPending
    },
    setShowReservationInfo
  });

  const handleReservationInfoClose = createHandleReservationInfoClose(
    setShowReservationInfo
  );

  const handleApprove = async (data: ShareholderFormData) => {
    // Convert to array of ShareholderFormData if needed
    const formDataArray = Array.isArray(data) ? data : [data];
    setFormData(formDataArray);
    setIsSubmitting(true);

    try {
      // Transform ShareholderData to ShareholderInput[] format for API
      const shareholderInputs: ShareholderInput[] = [];

      // Only process if shareholders exist
      if (data.shareholders) {
        Object.keys(data.shareholders).forEach((key) => {
          const shareholder = data.shareholders?.[key];

          if (!selectedSacrifice || !shareholder) {
            throw new Error("No sacrifice selected or shareholder data is invalid");
          }

          // Ensure required properties exist on selectedSacrifice
          if (!selectedSacrifice.sacrifice_id || selectedSacrifice.share_price === undefined) {
            throw new Error("Sacrifice data is incomplete");
          }

          // Create the shareholder input object with all required fields
          const shareholderInput: ShareholderInput = {
            shareholder_name: shareholder.name,
            phone_number: shareholder.phone,
            transaction_id: reservationStatus?.transaction_id || "",
            sacrifice_id: selectedSacrifice.sacrifice_id,
            share_price: parseFloat(selectedSacrifice.share_price.toString()),
            shares_count: shareholder.shareCount,
            delivery_location: data.delivery?.location || "Kesimhane",
            delivery_fee: data.delivery?.useTeslimat ? 750 : 0, // Hardcoded fee value
            delivery_date: data.delivery?.date || "",
            delivery_address: data.delivery?.address || "",
            delivery_notes: data.delivery?.notes || "",
            // Add required fields for ShareholderInput
            security_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            purchased_by: "Web Portal",
            last_edited_by: "Web Portal",
            is_purchaser: data.is_purchaser,
            sacrifice_consent: data.sacrifice_consent,
            total_amount: 0, // Will be calculated on the server
            remaining_payment: 0 // Will be calculated on the server
          };

          shareholderInputs.push(shareholderInput);
        });
      }

      await createShareholders.mutateAsync(shareholderInputs);

      // Success handling
      goToStep("success");

      // Provide success response data matching expected return type
      return Promise.resolve({
        success: true,
        data: {
          shareholders: shareholderInputs
        }
      });
    } catch (error) {
      console.error("Error in handleApprove:", error);
      toast({
        variant: "destructive",
        title: "İşlem Hatası",
        description: "Hissedar bilgileri kaydedilirken bir hata oluştu."
      });
      return Promise.reject(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePdfDownload = createHandlePdfDownload();

  // Create custom timeout handler
  const handleCustomTimeout = createHandleCustomTimeout({
    resetStore,
    goToStep: goToStepAsString,
    toast,
    refetchSacrifices: async () => {
      await refetchSacrifices();
      return;
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
  const handleCustomTimeoutWithPromise = async () => {
    await handleCustomTimeout();
    return;
  };

  // Safe server time remaining
  const safeServerTimeRemaining = reservationStatus?.timeRemaining || undefined;

  // Function to update share count in a type-safe way
  const handleUpdateShareCount = (count: number) => {
    updateShareCount.mutate({
      transaction_id,
      share_count: count,
      operation: 'add'
    });
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
    refetchSacrifices,
    isSuccess,
    hasNavigatedAway,
    currentStep,
    transaction_id,
    selectedSacrifice,
    formData,
    updateShareCount: updateShareCountWrapper,
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
      console.log('Testing expire-reservation API with ID:', idToUse);

      fetch('/api/expire-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id: idToUse }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('API TEST RESPONSE:', data);
          toast({
            title: 'API Test Result',
            description: `Status: ${data.message || data.error || 'Unknown'}`
          });
        })
        .catch(err => {
          console.error('API TEST ERROR:', err);
          toast({
            variant: 'destructive',
            title: 'API Test Failed',
            description: err.message
          });
        });
    };
  }

  // When passing goToStep to the PageLayout, map our store's Step to FormViewStep
  const goToStepWrapper = (step: FormViewStep) => {
    if (step === "success") {
      // Now both types have "success" so we can just pass it directly
      goToStep("success" as StoreStep);
    } else {
      goToStep(step as StoreStep);
    }
  };

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
      isLoading={isLoading || isSubmitting}
      serverTimeRemaining={safeServerTimeRemaining}

      // Form handlers
      onSacrificeSelect={handleSacrificeSelect}
      updateShareCount={handleUpdateShareCount}
      setFormData={setFormData}
      goToStep={goToStepWrapper}
      resetStore={resetStore}
      setLastInteractionTime={setLastInteractionTime}
      setTimeLeft={setTimeLeft}
      handleApprove={async () => {
        try {
          // Create a mock ShareholderFormData from formData if needed
          const mockData: ShareholderFormData = {
            name: formData[0]?.name || "",
            phone: formData[0]?.phone || "",
            delivery_location: formData[0]?.delivery_location || "",
            delivery_fee: 0,
            sacrifice_consent: false,
            // Add mock shareholders data based on formData
            shareholders: formData.reduce((acc, item, index) => {
              acc[`shareholder_${index}`] = {
                name: item.name,
                phone: item.phone,
                shareCount: 1
              };
              return acc;
            }, {} as Record<string, { name: string; phone: string; shareCount: number }>),
            // Add mock delivery data
            delivery: {
              location: formData[0]?.delivery_location || "Kesimhane",
              useTeslimat: formData[0]?.delivery_location === "Ulus",
              date: new Date().toISOString().split('T')[0],
              address: "",
              notes: ""
            }
          };

          return handleApprove(mockData);
        } catch (error) {
          console.error("Error in handleApprove wrapper:", error);
          return Promise.reject(error);
        }
      }}
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
