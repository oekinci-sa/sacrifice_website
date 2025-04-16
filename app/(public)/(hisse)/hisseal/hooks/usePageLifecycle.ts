import {
    useHandleInteractionTimeout,
    useHandleNavigationHistory,
    useHandlePageUnload,
    useTrackInteractions,
} from "@/helpers/hisseal-helpers";
import { Step } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import { sacrificeSchema } from "@/types";
import { useMemo } from "react";
import { usePageEffects } from "./usePageEffects";
import { useUIResponsiveness } from "./useUIResponsiveness";

interface UsePageLifecycleProps {
    pathname: string;
    resetStore: () => void;
    goToStep: (step: Step) => void;
    setSuccess: (success: boolean) => void;
    setHasNavigatedAway: (away: boolean) => void;
    refetchSacrifices: () => void;
    isSuccess: boolean;
    hasNavigatedAway: boolean;
    currentStep: string;
    transaction_id: string;
    selectedSacrifice: sacrificeSchema | null;
    formData: any;
    updateShareCount: any;
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
    handleCustomTimeout: () => Promise<any>;
    toast: any;
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

    // Memoize refetch function to ensure it returns a Promise
    const refetchWithPromise = useMemo(() => {
        return async () => {
            const result = refetchSacrifices();
            return Promise.resolve(result);
        };
    }, [refetchSacrifices]);

    // Apply page-specific effects
    usePageEffects({
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