// Define toast function type
type ToastFunction = {
    (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void;
};

interface CustomTimeoutHandlerProps {
    resetStore: () => void;
    goToStep: (step: string) => void;
    toast: ToastFunction;
    refetchSacrifices: () => Promise<void>;
    transaction_id: string;
    setShowWarning: (show: boolean) => void;
    setIsDialogOpen: (open: boolean) => void;
    setShowReservationInfo: (show: boolean) => void;
    setShowThreeMinuteWarning: (show: boolean) => void;
    setShowOneMinuteWarning: (show: boolean) => void;
    setCameFromTimeout: (timeout: boolean) => void;
    needsRerender: React.MutableRefObject<boolean>;
}

export function createHandleCustomTimeout({
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
}: CustomTimeoutHandlerProps) {
    return async function handleCustomTimeout() {
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
    };
} 