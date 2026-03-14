import { useToast } from "@/components/ui/use-toast";
import { Step } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import { GenericReservationMutation } from "@/types/reservation";
import { SacrificeQueryResult, sacrificeSchema } from "@/types";
import { useCallback } from "react";
import { createHandleApprove, createHandlePdfDownload, createHandleReservationInfoClose, createHandleSacrificeSelect, createHandleShareCountSelect } from "../handlers/share-selection-handlers";
import { createHandleCustomTimeout } from "../handlers/timeout-handlers";

type FormDataType = {
  name: string;
  phone: string;
  delivery_location: string;
  is_purchaser?: boolean;
};

interface UseHissealPageHandlersProps {
  setCameFromTimeout: (value: boolean) => void;
  needsRerender: React.MutableRefObject<boolean>;
  generateNewTransactionId: () => void;
  setTempSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void;
  setIsDialogOpen: (open: boolean) => void;
  tempSelectedSacrifice: sacrificeSchema | null;
  updateShareCount: GenericReservationMutation;
  setSelectedSacrifice: (sacrifice: sacrificeSchema | null) => void;
  setFormData: (data: FormDataType[]) => void;
  goToStep: (step: Step) => void;
  setLastInteractionTime: (time: number) => void;
  transaction_id: string;
  createReservation: GenericReservationMutation;
  setShowReservationInfo: (show: boolean) => void;
  selectedSacrifice: sacrificeSchema | null;
  formData: FormDataType[];
  createShareholders: GenericReservationMutation;
  setSuccess: (success: boolean) => void;
  resetStore: () => void;
  refetchSacrifices: () => Promise<unknown>;
  setShowWarning: (show: boolean) => void;
  setShowThreeMinuteWarning: (show: boolean) => void;
  setShowOneMinuteWarning: (show: boolean) => void;
  handleDismissWarning: (warningType: "three-minute" | "one-minute") => void;
  performRedirect: () => Promise<unknown>;
}

export function useHissealPageHandlers({
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
  performRedirect,
}: UseHissealPageHandlersProps) {
  const { toast } = useToast();

  const handleSacrificeSelect = createHandleSacrificeSelect({
    setCameFromTimeout,
    needsRerender,
    setTempSelectedSacrifice,
    setIsDialogOpen,
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
    setShowReservationInfo,
  });

  const handleReservationInfoClose = createHandleReservationInfoClose(setShowReservationInfo);

  const handleApprove = createHandleApprove({
    selectedSacrifice,
    formData,
    createShareholders,
    setSuccess,
    goToStep,
    toast,
    transaction_id,
  });

  const handlePdfDownload = createHandlePdfDownload();

  const handleCustomTimeout = createHandleCustomTimeout({
    performRedirect,
    setShowWarning,
    setIsDialogOpen,
    setShowReservationInfo,
    setShowThreeMinuteWarning,
    setShowOneMinuteWarning,
    setCameFromTimeout,
    toast,
  });

  const handleCustomTimeoutWithPromise = useCallback(async () => {
    return await handleCustomTimeout();
  }, [handleCustomTimeout]);

  const refetchSacrificesWrapper = useCallback(async (): Promise<SacrificeQueryResult> => {
    try {
      const result = await refetchSacrifices();
      const data = Array.isArray(result) ? result : (result as SacrificeQueryResult)?.data ?? undefined;
      return { data, success: true };
    } catch (error) {
      return {
        data: undefined,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }, [refetchSacrifices]);

  const handleUpdateShareCount = useCallback(
    async (count: number) => {
      try {
        if (updateShareCount && typeof updateShareCount.mutateAsync === "function") {
          await updateShareCount.mutateAsync({
            transaction_id,
            share_count: count,
            operation: "add",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Sistem hatası: Hisse güncellemesi yapılamıyor.",
          });
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hisse sayısı güncellenirken bir sorun oluştu.",
        });
      }
    },
    [updateShareCount, transaction_id, toast]
  );

  const handleDismissWarningWrapper = useCallback(
    (warningType: "three-minute" | "one-minute" = "three-minute") => {
      handleDismissWarning(warningType);
    },
    [handleDismissWarning]
  );

  return {
    handleSacrificeSelect,
    handleShareCountSelect,
    handleReservationInfoClose,
    handleApprove,
    handlePdfDownload,
    handleCustomTimeout,
    handleCustomTimeoutWithPromise,
    refetchSacrificesWrapper,
    handleUpdateShareCount,
    handleDismissWarningWrapper,
  };
}
