"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  handleApprove as helperHandleApprove,
  handleShareCountSelect as helperHandleShareCountSelect,
  useHandleInteractionTimeout,
  useHandleNavigationHistory,
  useHandlePageUnload,
  useTrackInteractions,
} from "@/helpers/hisseal-helpers";
import {
  ReservationStatus,
  useCreateReservation,
  useReservationStatus,
  useUpdateShareCount,
} from "@/hooks/useReservations";
import { useCreateShareholders } from "@/hooks/useShareholders";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { useShareSelectionFlowStore } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import { sacrificeSchema } from "@/types";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormView } from "./components/process-state/form-view";
import { ReservationInfoDialog } from "./components/reservation-info-dialog";
import { SuccessView } from "./components/success-state/success-view";
import { columns } from "./components/table-step/columns";
import { ShareSelectDialog } from "./components/table-step/share-select-dialog";

const TIMEOUT_DURATION = 180; // 15 saniye
const WARNING_THRESHOLD = 60; // 5 saniye kala uyarı göster

const Page = () => {
  const { toast } = useToast();
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [isReservationLoading, setIsReservationLoading] = useState(false);
  const [showReservationInfo, setShowReservationInfo] = useState(false);

  // Track if we came from a timeout (used for special handling to ensure interactivity)
  const [cameFromTimeout, setCameFromTimeout] = useState(false);

  // Use ref to track if we need to force UI rerender
  const needsRerender = useRef(false);

  // Expiration warning states
  const [showThreeMinuteWarning, setShowThreeMinuteWarning] = useState(false);
  const [showOneMinuteWarning, setShowOneMinuteWarning] = useState(false);

  // Zustand data store for sacrifices
  const {
    sacrifices,
    isLoadingSacrifices,
    isRefetching,
    refetchSacrifices
  } = useSacrificeStore();

  // Zustand UI flow store
  const {
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
    setHasNavigatedAway
  } = useShareSelectionFlowStore();

  // Reservation store - transaction_id yönetimi
  const { transaction_id, generateNewTransactionId } = useReservationIDStore();

  // Remove React Query fetch since we're using the Zustand store data
  // const { data, isLoading: isQueryLoading } = useSacrifices();
  const updateShareCount = useUpdateShareCount();
  const createShareholders = useCreateShareholders();
  const createReservation = useCreateReservation();

  // Reservation status hook (only active in details and confirmation steps)
  const shouldCheckStatus =
    currentStep === "details" || currentStep === "confirmation";
  const {
    data: reservationStatus,
    isLoading: isStatusLoading,
  } = useReservationStatus(shouldCheckStatus ? transaction_id : "");

  // Combined loading state - Yükleniyor göstergesini ilk yüklenme sırasında göstermeyelim
  // Sadece kullanıcı işlem yaparken (hisse seçimi, rezervasyon vb.) gösterelim
  const isLoading =
    (currentStep !== "selection" && isLoadingSacrifices) ||
    isStatusLoading ||
    (currentStep !== "selection" && isRefetching);

  // Fetch data when the component mounts or when navigating to this page
  useEffect(() => {
    // Fetch fresh data when mounting the component
    if (pathname === "/hisseal") {
      console.log("Fetching fresh sacrifice data on page navigation");
      refetchSacrifices();
    }
  }, [pathname, refetchSacrifices]);

  // Custom timeout handler that marks we came from a timeout
  const handleTimeoutRedirect = useCallback(() => {
    console.log("Timeout occurred, redirecting to selection step");
    resetStore();
    goToStep("selection");
    setCameFromTimeout(true);
    needsRerender.current = true;

    // Also refresh data immediately after timeout
    refetchSacrifices();
  }, [resetStore, goToStep, refetchSacrifices]);

  // Handle reservation status changes
  useEffect(() => {
    if (!reservationStatus || !shouldCheckStatus) return;

    console.log("Reservation status updated:", reservationStatus);

    // If status is expired, redirect to selection step
    if (reservationStatus.status === ReservationStatus.EXPIRED) {
      // Açık dialogları kapat
      setIsDialogOpen(false);
      setShowReservationInfo(false);
      setShowThreeMinuteWarning(false);
      setShowOneMinuteWarning(false);

      toast({
        variant: "destructive",
        title: "Rezervasyon Süresi Doldu",
        description:
          "Rezervasyon süresi dolduğu için hisse seçim sayfasına yönlendiriliyorsunuz.",
      });

      // Use our special timeout handler
      handleTimeoutRedirect();
      return;
    }

    // Update expiration countdown if we have timeRemaining
    if (reservationStatus.timeRemaining !== null) {
      const remainingSeconds = reservationStatus.timeRemaining;

      // Show warning at 3 minutes remaining
      if (
        remainingSeconds <= 180 &&
        remainingSeconds > 60 &&
        !showThreeMinuteWarning
      ) {
        setShowThreeMinuteWarning(true);
      }

      // Show warning at 1 minute remaining
      if (remainingSeconds <= 60 && !showOneMinuteWarning) {
        setShowOneMinuteWarning(true);
      }
    }
  }, [
    reservationStatus,
    shouldCheckStatus,
    resetStore,
    goToStep,
    toast,
    showThreeMinuteWarning,
    showOneMinuteWarning,
    handleTimeoutRedirect,
  ]);

  // Rezervasyon işlemi sırasında yükleniyor durumunu yönet
  useEffect(() => {
    // En basit ve güvenli kontrole dönelim
    try {
      // TypeScript hatalarını önlemek için daha güvenli bir kontrol yapalım
      const pendingState = createReservation.isPending === true;
      // @ts-expect-error - React Query v4/v5 property compatibility - isLoading may not exist in all versions
      const loadingState = createReservation.isLoading === true;
      // @ts-expect-error - React Query v4/v5 property compatibility - isFetching may not exist in all versions
      const fetchingState = createReservation.isFetching === true;

      const isLoading = pendingState || loadingState || fetchingState || false;

      if (isLoading) {
        setIsReservationLoading(true);
      } else {
        // Kısa bir gecikme ile yükleniyor durumunu kaldır (UI geçişi için)
        const timer = setTimeout(() => setIsReservationLoading(false), 300);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      // Herhangi bir hata durumunda, yükleme durumunu kapat
      console.warn("React Query yükleme durumu kontrol edilemedi:", error);
      setIsReservationLoading(false);
    }
  }, [createReservation]);

  // Handle the return to selection step with special handling for timeout cases
  useEffect(() => {
    // Check if we've returned to the selection step
    if (currentStep === "selection") {
      console.log("Returned to selection step - refreshing data");

      // If we came from a timeout, apply special handling to ensure UI responsiveness
      if (cameFromTimeout) {
        console.log("Applying special handling for post-timeout state");

        // Immediate data refresh
        refetchSacrifices();

        // Apply a delayed second refresh for reliability
        const timeoutId = setTimeout(() => {
          console.log("Executing delayed refresh after timeout");
          refetchSacrifices();

          // Force a state update to trigger re-render
          setCameFromTimeout(false);
          needsRerender.current = false;
        }, 300);

        return () => clearTimeout(timeoutId);
      } else {
        // Regular refresh for normal navigation
        refetchSacrifices();
      }
    }
  }, [currentStep, refetchSacrifices, cameFromTimeout]);

  // Additional effect to ensure table is responsive after timeout
  useEffect(() => {
    // This fixes the issue where buttons become unresponsive after timeout
    if (currentStep === "selection" && !isLoadingSacrifices && !isRefetching && sacrifices.length > 0) {
      // For post-timeout case, apply special handling
      if (needsRerender.current) {
        console.log("Applying forced reattachment for event handlers");

        // Create a sequence of micro-timeouts to ensure the UI thread gets updated
        const timer1 = setTimeout(() => {
          // Force a small update to help event handlers reattach
          setLastInteractionTime(Date.now());
        }, 100);

        const timer2 = setTimeout(() => {
          // Secondary force update
          setTimeLeft(TIMEOUT_DURATION);
        }, 200);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }

      // Standard handling even without timeout
      const timer = setTimeout(() => {
        console.log("Ensuring UI responsiveness after data load");
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [currentStep, isLoadingSacrifices, isRefetching, sacrifices.length]);

  // Check if we need to reset the success state due to navigation
  useEffect(() => {
    if (hasNavigatedAway && isSuccess) {
      console.log("Resetting success state due to previous navigation");
      resetStore();
      setSuccess(false);
      setHasNavigatedAway(false);
    }
  }, [
    hasNavigatedAway,
    isSuccess,
    resetStore,
    setSuccess,
    setHasNavigatedAway,
  ]);

  // Reset form state when entering the page
  useEffect(() => {
    if (pathname === "/hisseal" && !isSuccess) {
      resetStore();
      goToStep("selection");
      // Yeni bir transaction_id oluştur
      generateNewTransactionId();

      // Reset warning states
      setShowThreeMinuteWarning(false);
      setShowOneMinuteWarning(false);

      // Reset timeout tracking
      setCameFromTimeout(false);
      needsRerender.current = false;

      // Console'a transaction_id değerini ve uzunluğunu logla (debug için)
      console.log("Generated new transaction_id:", {
        id: useReservationIDStore.getState().transaction_id,
        length: useReservationIDStore.getState().transaction_id.length,
      });
    }
  }, [pathname, resetStore, goToStep, generateNewTransactionId, isSuccess]);

  // Special handler called from the interaction timeout hook
  const handleCustomTimeout = useCallback(async () => {
    console.log("Custom timeout handler triggered");

    // First, immediately reset all UI states
    setShowWarning(false);

    // Close any open dialogs
    setIsDialogOpen(false);
    setShowReservationInfo(false);
    setShowThreeMinuteWarning(false);
    setShowOneMinuteWarning(false);

    // Small delay to ensure UI updates before further processing
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // Update the reservation status on the server if we have a transaction_id
      if (transaction_id) {
        const timeoutReservation = {
          mutateAsync: async ({ transaction_id }: { transaction_id: string }) => {
            try {
              const response = await fetch("/api/timeout-reservation", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ transaction_id }),
              });

              if (!response.ok) {
                throw new Error("Failed to timeout reservation");
              }

              return await response.json();
            } catch (error) {
              console.error("Error in timeout reservation:", error);
              throw error;
            }
          }
        };

        await timeoutReservation.mutateAsync({ transaction_id });
      }
    } catch (error) {
      console.error("Error timing out reservation:", error);
    } finally {
      // Mark that we came from a timeout 
      setCameFromTimeout(true);
      needsRerender.current = true;

      // Reset store and navigate to selection step
      resetStore();
      goToStep("selection");

      // Show a toast notification
      toast({
        variant: "destructive",
        title: "Oturum Zaman Aşımına Uğradı",
        description: "Uzun süre işlem yapılmadığı için form sıfırlandı.",
      });

      // Refresh data
      refetchSacrifices();
    }
  }, [resetStore, goToStep, toast, refetchSacrifices, transaction_id, setShowWarning]);

  // Set navigation flag when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (isSuccess) {
        console.log("Component unmounting, setting navigated away flag");
        setHasNavigatedAway(true);
      }
    };
  }, [isSuccess, setHasNavigatedAway]);

  // Add beforeunload listener to handle page refreshes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isSuccess) {
        console.log("Page refresh/close detected, setting navigated away flag");
        setHasNavigatedAway(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSuccess, setHasNavigatedAway]);

  // Handle navigation changes
  useHandleNavigationHistory({
    currentStep,
    selectedSacrifice,
    formData,
    updateShareCount,
    resetStore,
    goToStep,
    isSuccess,
    setHasNavigatedAway,
    toast,
    // Dialog durumlarını parametre olarak geçir
    openDialogs: {
      isDialogOpen,
      setIsDialogOpen,
      showReservationInfo,
      setShowReservationInfo,
      showThreeMinuteWarning,
      setShowThreeMinuteWarning,
      showOneMinuteWarning,
      setShowOneMinuteWarning,
    },
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
    WARNING_THRESHOLD,
    {
      isDialogOpen,
      setIsDialogOpen,
      showReservationInfo,
      setShowReservationInfo,
      showThreeMinuteWarning,
      setShowThreeMinuteWarning,
      showOneMinuteWarning,
      setShowOneMinuteWarning,
    },
    refetchSacrifices,
    handleCustomTimeout // Pass our custom timeout handler
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
    formData,
    isSuccess,
  });

  // Handler for dismissing expiration warnings
  const handleDismissWarning = useCallback(
    (warningType: "three-minute" | "one-minute") => {
      if (warningType === "three-minute") {
        setShowThreeMinuteWarning(false);
      } else {
        setShowOneMinuteWarning(false);
      }
    },
    []
  );

  const handleSacrificeSelect = async (sacrifice: sacrificeSchema) => {
    // When the user interacts with a sacrifice, we're definitely no longer in post-timeout state
    setCameFromTimeout(false);
    needsRerender.current = false;

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
        createReservation,
      });

      // Direkt olarak details adımına geç
      goToStep("details");

      // Details adımına geçtikten SONRA bilgi diyaloğunu göster
      setTimeout(() => {
        setShowReservationInfo(true);
      }, 300);
    } catch (error) {
      console.error("Error in handleShareCountSelect:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          "İşlem sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      // Hata olsa bile yükleniyor durumunu kaldır
      setTimeout(() => setIsReservationLoading(false), 300);
    }
  };

  // Handle the continuation after reservation info dialog is closed
  const handleReservationInfoClose = () => {
    setShowReservationInfo(false);
    // Artık ilerleme gerekmiyor çünkü zaten details adımındayız
  };

  const handleApprove = async () => {
    await helperHandleApprove({
      selectedSacrifice,
      formData,
      createShareholders,
      setSuccess,
      goToStep,
      toast,
    });
  };

  const handlePdfDownload = () => {
    // PDF indirme işlemi buraya eklenecek
    console.log("PDF indirme işlemi");
  };

  // Calculate remaining minutes for display in warnings
  const getRemainingMinutesText = () => {
    if (!reservationStatus || !reservationStatus.timeRemaining) return "";

    const minutes = Math.ceil(reservationStatus.timeRemaining / 60);
    return `${minutes} dakika`;
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
          data={sacrifices}
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
          isLoading={isLoading || isReservationLoading}
          serverTimeRemaining={reservationStatus?.timeRemaining}
        />
      )}

      {/* Dialog for selecting share count */}
      {tempSelectedSacrifice && (
        <ShareSelectDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          sacrifice={tempSelectedSacrifice}
          onSelect={handleShareCountSelect}
          isLoading={isReservationLoading}
        />
      )}

      {/* Reservation Info Dialog - shown after share selection */}
      <ReservationInfoDialog
        isOpen={showReservationInfo}
        onClose={handleReservationInfoClose}
      />

      {/* 3-Minute warning dialog */}
      <AlertDialog
        open={showThreeMinuteWarning}
        onOpenChange={() => setShowThreeMinuteWarning(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rezervasyon Süresi Uyarısı</AlertDialogTitle>
            <AlertDialogDescription>
              Hisse rezervasyon sürenizin dolmasına yaklaşık{" "}
              {getRemainingMinutesText()} kaldı. Lütfen işleminizi tamamlayınız,
              aksi takdirde rezervasyonunuz iptal edilecek ve hisse seçim
              sayfasına yönlendirileceksiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => handleDismissWarning("three-minute")}
            >
              Anladım
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 1-Minute warning dialog */}
      <AlertDialog
        open={showOneMinuteWarning}
        onOpenChange={() => setShowOneMinuteWarning(false)}
      >
        <AlertDialogContent className="bg-red-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">
              Son Uyarı: Rezervasyon Süresi Doluyor!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-600">
              Hisse rezervasyon sürenizin dolmasına yalnızca{" "}
              {getRemainingMinutesText()} kaldı. Lütfen işleminizi hemen
              tamamlayınız, aksi takdirde rezervasyonunuz iptal edilecek ve tüm
              bilgileriniz silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => handleDismissWarning("one-minute")}
              className="bg-red-600 hover:bg-red-700"
            >
              Acilen Tamamla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Page;
