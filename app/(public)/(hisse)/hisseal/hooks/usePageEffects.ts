import { useEffect } from "react";

interface UsePageEffectsProps {
    // Path and routing
    pathname: string;

    // Store actions
    resetStore: () => void;
    goToStep: (step: any) => void;
    setSuccess: (success: boolean) => void;
    setHasNavigatedAway: (navigated: boolean) => void;

    // Data fetching
    refetchSacrifices: () => void;

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
            console.log("Navigated to hisseal page - resetting state");

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
            refetchSacrifices();
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
            console.log("Fetching fresh sacrifice data on page navigation");
            refetchSacrifices();
        }
    }, [pathname, refetchSacrifices]);

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
    }, [currentStep, refetchSacrifices, cameFromTimeout, setCameFromTimeout, needsRerender]);

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
} 