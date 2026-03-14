import { useEffect } from "react";

interface UseUIResponsivenessProps {
    currentStep: string;
    isLoadingSacrifices: boolean;
    isRefetching: boolean;
    sacrificesLength: number;
    setLastInteractionTime: (time: number) => void;
    needsRerender: React.MutableRefObject<boolean>;
}

export function useUIResponsiveness({
    currentStep,
    isLoadingSacrifices,
    isRefetching,
    sacrificesLength,
    setLastInteractionTime,
    needsRerender
}: UseUIResponsivenessProps) {
    useEffect(() => {
        if (currentStep === "selection" && !isLoadingSacrifices && !isRefetching && sacrificesLength > 0) {
            if (needsRerender.current) {
                const timer = setTimeout(() => {
                    setLastInteractionTime(Date.now());
                }, 100);
                return () => clearTimeout(timer);
            }
        }
    }, [
        currentStep,
        isLoadingSacrifices,
        isRefetching,
        sacrificesLength,
        setLastInteractionTime,
        needsRerender
    ]);
} 