import { Step } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import { SacrificeQueryResult } from "@/types";
import { useEffect } from "react";

interface UsePageEffectsProps {
    // Path and routing
    pathname: string;

    // Store actions
    resetStore: () => void;
    goToStep: (step: Step) => void;
    setSuccess: (success: boolean) => void;
    setHasNavigatedAway: (navigated: boolean) => void;

    // Data fetching
    refetchSacrifices: () => Promise<SacrificeQueryResult>;

    // State values
    isSuccess: boolean;
    hasNavigatedAway: boolean;
    currentStep: string;
    transaction_id: string;

    // Warning state setters
    setShowThreeMinuteWarning: (show: boolean) => void;
    setShowOneMinuteWarning: (show: boolean) => void;

    // Timeout state
    cameFromTimeout: boolean;
    setCameFromTimeout: (timeout: boolean) => void;

    // Transaction ID management
    generateNewTransactionId: () => void;

    // UI state ref
    needsRerender: React.MutableRefObject<boolean>;
}

export function usePageEffects({
    pathname,
    resetStore,
    goToStep,
    setSuccess,
    setHasNavigatedAway,
    refetchSacrifices,
    isSuccess,
    hasNavigatedAway,
    currentStep,
    setShowThreeMinuteWarning,
    setShowOneMinuteWarning,
    cameFromTimeout,
    setCameFromTimeout,
    generateNewTransactionId,
    needsRerender
}: UsePageEffectsProps) {

    // Reset success state and store when navigating to hisseal page
    useEffect(() => {
        // Always reset success state when navigating to the hisseal page
        if (pathname === "/hisseal") {
            // Reset the entire store - this ensures fresh start every time
            resetStore();

            // Explicitly set success to false to ensure it's not persisted
            setSuccess(false);

            // Reset navigation state
            setHasNavigatedAway(false);

            // Set initial step
            goToStep("selection");

            // Generate new transaction ID
            generateNewTransactionId();

            // Reset warning states
            setShowThreeMinuteWarning(false);
            setShowOneMinuteWarning(false);

            // Reset timeout tracking
            setCameFromTimeout(false);
            needsRerender.current = false;

            // Fetch fresh data
            (async () => {
                try {
                    await refetchSacrifices();
                } catch {
                }
            })();
        }
    }, [
        pathname,
        resetStore,
        setSuccess,
        setHasNavigatedAway,
        goToStep,
        generateNewTransactionId,
        setShowThreeMinuteWarning,
        setShowOneMinuteWarning,
        setCameFromTimeout,
        needsRerender,
        refetchSacrifices
    ]);

    // Fetch data when the component mounts or when navigating to this page
    useEffect(() => {
        // Fetch fresh data when mounting the component
        if (pathname === "/hisseal") {
            // Fetch fresh data when mounting the component
            (async () => {
                try {
                    await refetchSacrifices();
                } catch {
                }
            })();
        }
    }, [pathname, refetchSacrifices]);

    // Handle the return to selection step with special handling for timeout cases
    useEffect(() => {
        if (currentStep === "selection") {
            if (cameFromTimeout) {
                (async () => {
                    try {
                        await refetchSacrifices();
                    } catch { }
                })();

                const timeoutId = setTimeout(() => {
                    (async () => {
                        try {
                            await refetchSacrifices();
                        } catch { }
                        setCameFromTimeout(false);
                        needsRerender.current = false;
                    })();
                }, 300);

                return () => clearTimeout(timeoutId);
            } else {
                (async () => {
                    try {
                        await refetchSacrifices();
                    } catch { }
                })();
            }
        }
    }, [currentStep, refetchSacrifices, cameFromTimeout, setCameFromTimeout, needsRerender]);


    // Check if we need to reset the success state due to navigation
    useEffect(() => {
        if (hasNavigatedAway && isSuccess) {
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
} 