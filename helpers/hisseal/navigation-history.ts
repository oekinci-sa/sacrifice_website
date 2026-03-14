import { useCancelReservation } from "@/hooks/useReservations";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { sacrificeSchema, Step } from "@/types";
import { useEffect } from "react";

export const useHandleNavigationHistory = ({
  currentStep,
  selectedSacrifice,
  formData,
  updateShareCount,
  resetStore,
  goToStep,
  isSuccess,
  setHasNavigatedAway,
  toast,
  openDialogs
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: unknown[];
  updateShareCount: unknown;
  resetStore: () => void;
  goToStep: (step: Step) => void;
  isSuccess: boolean;
  setHasNavigatedAway: (value: boolean) => void;
  toast: (opts: { variant?: "default" | "destructive"; title?: string; description?: string }) => void;
  openDialogs?: {
    isDialogOpen?: boolean;
    setIsDialogOpen?: (open: boolean) => void;
    showReservationInfo?: boolean;
    setShowReservationInfo?: (show: boolean) => void;
    showThreeMinuteWarning?: boolean;
    setShowThreeMinuteWarning?: (show: boolean) => void;
    showOneMinuteWarning?: boolean;
    setShowOneMinuteWarning?: (show: boolean) => void;
  }
}) => {
  const transaction_id = useReservationIDStore(state => state.transaction_id);
  const generateNewTransactionId = useReservationIDStore(state => state.generateNewTransactionId);
  const cancelReservation = useCancelReservation();

  useEffect(() => {
    const handleRouteChange = async (): Promise<boolean> => {
      if (isSuccess) return true;
      if (currentStep !== "details" && currentStep !== "confirmation") return true;
      if (!selectedSacrifice || !(formData as unknown[]).length) return true;
      if (!transaction_id) return true;

      try {
        if (openDialogs) {
          if (openDialogs.setIsDialogOpen && openDialogs.isDialogOpen) {
            openDialogs.setIsDialogOpen(false);
          }
          if (openDialogs.setShowReservationInfo && openDialogs.showReservationInfo) {
            openDialogs.setShowReservationInfo(false);
          }
          if (openDialogs.setShowThreeMinuteWarning && openDialogs.showThreeMinuteWarning) {
            openDialogs.setShowThreeMinuteWarning(false);
          }
          if (openDialogs.setShowOneMinuteWarning && openDialogs.showOneMinuteWarning) {
            openDialogs.setShowOneMinuteWarning(false);
          }
        }

        await cancelReservation.mutateAsync({
          transaction_id
        });

        // CRITICAL: resetStore + generateNewTransactionId must ALWAYS be called
        // together. Without generateNewTransactionId the next reservation reuses the
        // old transaction_id and the 15-min timer resumes from the previous session.
        resetStore();
        generateNewTransactionId();
      } catch {
        // Removed console.error
      }

      if (isSuccess) {
        setHasNavigatedAway(true);
      }

      return true;
    };

    const handlePopState = async (event: PopStateEvent) => {
      const result = await handleRouteChange();
      if (!result) {
        event.preventDefault();
        history.pushState(null, "", window.location.href);
      }
    };

    function createHistoryStateHandler(originalFn: (data: unknown, unused: string, url?: string | URL | null) => void) {
      return function (this: History, data: unknown, unused: string, url?: string | URL | null) {
        if (url) {
          handleRouteChange().then((shouldContinue) => {
            if (shouldContinue) {
              originalFn.apply(this, [data, unused, url] as [unknown, string, string | URL | null]);
            }
          });
        }
      };
    }

    window.addEventListener("popstate", handlePopState);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = createHistoryStateHandler(originalPushState);
    window.history.replaceState = createHistoryStateHandler(originalReplaceState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [
    currentStep,
    selectedSacrifice,
    formData,
    updateShareCount,
    resetStore,
    goToStep,
    isSuccess,
    toast,
    transaction_id,
    cancelReservation,
    setHasNavigatedAway,
    openDialogs
  ]);
};
