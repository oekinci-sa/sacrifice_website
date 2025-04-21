import {
    useHandleInteractionTimeout,
    useHandleNavigationHistory,
    useHandlePageUnload,
    useTrackInteractions,
} from "@/helpers/hisseal-helpers";
import { Step } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import { SacrificeQueryResult, sacrificeSchema } from "@/types";
import { UpdateShareCountMutation } from "@/types/reservation";
import { useMemo } from "react";
import { usePageEffects } from "./usePageEffects";
import { useUIResponsiveness } from "./useUIResponsiveness";

// Form data type
type FormDataType = {
    name: string;
    phone: string;
    delivery_location: string;
    is_purchaser?: boolean;
};

// Toast function type
type ToastFunction = {
    (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void;
};

interface UsePageLifecycleProps {
    pathname: string;
    resetStore: () => void;
    goToStep: (step: Step) => void;
    setSuccess: (success: boolean) => void;
    setHasNavigatedAway: (away: boolean) => void;
    refetchSacrifices: () => Promise<sacrificeSchema[]>;
    isSuccess: boolean;
    hasNavigatedAway: boolean;
    currentStep: string;
    transaction_id: string;
    selectedSacrifice: sacrificeSchema | null;
    formData: FormDataType[];
    updateShareCount: UpdateShareCountMutation;
    sacrifices: sacrificeSchema[];
    isLoadingSacrifices: boolean;
    isRefetching: boolean;
    generateNewTransactionId: () => void;
    needsRerender: React.MutableRefObject<boolean>;
    isDialogOpen: boolean;
    setIsDialogOpen: (open: boolean) => void;
    lastInteractionTime: number;
    setLastInteractionTime: (time: number) => void;
    showWarning: boolean;
    setShowWarning: (show: boolean) => void;
    setTimeLeft: (time: number) => void;
    showReservationInfo: boolean;
    setShowReservationInfo: (show: boolean) => void;
    showThreeMinuteWarning: boolean;
    setShowThreeMinuteWarning: (show: boolean) => void;
    showOneMinuteWarning: boolean;
    setShowOneMinuteWarning: (show: boolean) => void;
    cameFromTimeout: boolean;
    setCameFromTimeout: (timeout: boolean) => void;
    TIMEOUT_DURATION: number;
    WARNING_THRESHOLD: number;
    handleCustomTimeout: () => Promise<void>;
    toast: ToastFunction;
}

export function usePageLifecycle({
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
    handleCustomTimeout,
    toast
}: UsePageLifecycleProps) {

    // Memoize step converter to maintain stable reference
    const stepConverter = useMemo(() => {
        return (step: string) => goToStep(step as Step);
    }, [goToStep]);

    // Memoize dialog state object to avoid rerenders
    const dialogState = useMemo(() => {
        return {
            isDialogOpen,
            setIsDialogOpen,
            showReservationInfo,
            setShowReservationInfo,
            showThreeMinuteWarning,
            setShowThreeMinuteWarning,
            showOneMinuteWarning,
            setShowOneMinuteWarning,
        };
    }, [
        isDialogOpen,
        setIsDialogOpen,
        showReservationInfo,
        setShowReservationInfo,
        showThreeMinuteWarning,
        setShowThreeMinuteWarning,
        showOneMinuteWarning,
        setShowOneMinuteWarning
    ]);

    // Memoize custom timeout handler to ensure it returns a Promise
    const timeoutHandlerWithPromise = useMemo(() => {
        return async () => {
            return await Promise.resolve(handleCustomTimeout());
        };
    }, [handleCustomTimeout]);

    // refetchSacrifices için sarmalayıcı fonksiyon oluştur
    const safeRefetchSacrifices = useMemo(() => {
        return async (): Promise<SacrificeQueryResult> => {
            try {
                const result = await refetchSacrifices();
                // Now result is a sacrificeSchema[] array, convert it to a SacrificeQueryResult
                return {
                    data: result,
                    success: true
                };
            } catch (error) {
                return {
                    data: undefined,
                    success: false,
                    error: error instanceof Error ? error : new Error(String(error))
                };
            }
        };
    }, [refetchSacrifices]);

    // Memoize refetch function to ensure it returns a Promise - for useHandleInteractionTimeout
    const refetchWithPromise = useMemo(() => {
        return safeRefetchSacrifices; // Aynı fonksiyonu kullan
    }, [safeRefetchSacrifices]);

    // Apply page-specific effects
    usePageEffects({
        pathname,
        resetStore,
        goToStep,
        setSuccess,
        setHasNavigatedAway,
        refetchSacrifices: safeRefetchSacrifices,
        isSuccess,
        hasNavigatedAway,
        currentStep,
        transaction_id,
        setShowThreeMinuteWarning,
        setShowOneMinuteWarning,
        cameFromTimeout,
        setCameFromTimeout,
        generateNewTransactionId,
        needsRerender
    });

    // Apply UI responsiveness effect
    useUIResponsiveness({
        currentStep,
        isLoadingSacrifices,
        isRefetching,
        sacrificesLength: sacrifices.length,
        setLastInteractionTime,
        setTimeLeft,
        TIMEOUT_DURATION,
        needsRerender
    });

    // Handle navigation changes - using the hooks directly
    useHandleNavigationHistory({
        currentStep,
        selectedSacrifice,
        formData,
        updateShareCount,
        resetStore,
        goToStep: stepConverter,
        isSuccess,
        setHasNavigatedAway,
        toast,
        openDialogs: dialogState,
    });

    // Handle interaction timeout - using the hooks directly
    useHandleInteractionTimeout(
        isSuccess,
        currentStep,
        selectedSacrifice,
        formData,
        updateShareCount,
        stepConverter,
        resetStore,
        lastInteractionTime,
        showWarning,
        setShowWarning,
        setTimeLeft,
        TIMEOUT_DURATION,
        WARNING_THRESHOLD,
        dialogState,
        refetchWithPromise,
        timeoutHandlerWithPromise
    );

    // Track interactions at page level
    useTrackInteractions(
        currentStep,
        setLastInteractionTime,
        setShowWarning,
        setTimeLeft,
        TIMEOUT_DURATION
    );

    // Handle page unload/refresh DB updates
    useHandlePageUnload({
        currentStep,
        selectedSacrifice,
        formData,
        isSuccess,
    });
} 