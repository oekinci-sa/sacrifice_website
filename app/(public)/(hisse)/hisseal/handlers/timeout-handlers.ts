import { Step } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import { SacrificeQueryResult } from "@/types";

// Define toast function type
type ToastFunction = {
    (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void;
};

interface CustomTimeoutHandlerProps {
    resetStore: () => void;
    goToStep: (step: Step) => void;
    toast: ToastFunction;
    refetchSacrifices: () => Promise<SacrificeQueryResult | void>;
    transaction_id: string;
    setShowWarning: (show: boolean) => void;
    setIsDialogOpen: (open: boolean) => void;
    setShowReservationInfo: (show: boolean) => void;
    setShowThreeMinuteWarning: (show: boolean) => void;
    setShowOneMinuteWarning: (show: boolean) => void;
    setCameFromTimeout: (timeout: boolean) => void;
    needsRerender: React.MutableRefObject<boolean>;
}

export const createHandleCustomTimeout = ({
    resetStore,
    goToStep,
    toast,
    refetchSacrifices,
    transaction_id,
    setShowWarning,
    setIsDialogOpen,
    setShowReservationInfo,
    setShowThreeMinuteWarning,
    setShowOneMinuteWarning,
    setCameFromTimeout,
    needsRerender
}: CustomTimeoutHandlerProps) => {
    return async () => {
        // Close any open dialogs
        setShowWarning(false);
        setIsDialogOpen(false);
        setShowReservationInfo(false);
        setShowThreeMinuteWarning(false);
        setShowOneMinuteWarning(false);

        // Mark that we're in a timeout state
        setCameFromTimeout(true);

        // Reset the store and go back to selection step
        resetStore();
        goToStep("selection");

        // Mark that we need a rerender
        needsRerender.current = true;

        let apiError = false;

        try {
            // Call expire-reservation API if transaction_id is available
            if (transaction_id) {
                await fetch('/api/expire-reservation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ transaction_id }),
                });
            }
        } catch {
            apiError = true;
        }

        // Try to refresh data, regardless of API call outcome
        try {
            const result = await refetchSacrifices();
            // result undefined olabilir (void dönüş durumu)
            if (result && !result.success) {
            }
        } catch {
        }

        // Show appropriate toast message based on API success
        if (apiError) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "İşlem zaman aşımına uğrarken bir sorun oluştu."
            });
        } else {
            toast({
                title: "İşlem Süresi Doldu",
                description: "İşlem süresi dolduğu için hisse seçim sayfasına yönlendirildiniz."
            });
        }

        return Promise.resolve();
    };
}; 