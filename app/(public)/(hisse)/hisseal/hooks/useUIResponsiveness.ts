import { useEffect } from "react";

interface UseUIResponsivenessProps {
    currentStep: string;
    isLoadingSacrifices: boolean;
    isRefetching: boolean;
    sacrificesLength: number;
    setLastInteractionTime: (time: number) => void;
    setTimeLeft: (time: number) => void;
    TIMEOUT_DURATION: number;
    needsRerender: React.MutableRefObject<boolean>;
}

export function useUIResponsiveness({
    currentStep,
    isLoadingSacrifices,
    isRefetching,
    sacrificesLength,
    setLastInteractionTime,
    setTimeLeft,
    TIMEOUT_DURATION,
    needsRerender
}: UseUIResponsivenessProps) {
    // Effect to ensure table is responsive after timeout
    useEffect(() => {
        // This fixes the issue where buttons become unresponsive after timeout
        if (currentStep === "selection" && !isLoadingSacrifices && !isRefetching && sacrificesLength > 0) {
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
    }, [
        currentStep,
        isLoadingSacrifices,
        isRefetching,
        sacrificesLength,
        setLastInteractionTime,
        setTimeLeft,
        TIMEOUT_DURATION,
        needsRerender
    ]);
} 