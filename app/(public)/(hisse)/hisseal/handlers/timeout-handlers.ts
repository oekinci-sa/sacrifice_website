import { CustomTimeoutHandlerProps } from "@/types/timeout";

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

        // Set timeout flag to trigger special handling in useEffect
        setCameFromTimeout(true);
        needsRerender.current = true;

        try {
            // Call the expire-reservation API endpoint to update the DB status
            if (transaction_id) {
                const response = await fetch("/api/expire-reservation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ transaction_id }),
                });

                if (!response.ok) {
                    console.error("Failed to expire reservation:", await response.json());
                }
            }

            // Show the timeout toast notification
            toast({
                variant: "destructive",
                title: "İşlem Süresi Doldu",
                description: "İşlem süresi dolduğu için hisse seçim sayfasına yönlendiriliyorsunuz.",
            });

            // Reset store and navigate to selection step
            resetStore();
            goToStep("selection");

            // Refresh sacrifice data to ensure latest state
            if (refetchSacrifices) {
                setTimeout(() => {
                    refetchSacrifices();
                }, 300);
            }
        } catch (error) {
            console.error("Error in custom timeout handler:", error);

            // Ensure state is reset even if API call fails
            toast({
                variant: "destructive",
                title: "İşlem Süresi Doldu",
                description: "İşlem süresi dolduğu için hisse seçim sayfasına yönlendiriliyorsunuz.",
            });

            resetStore();
            goToStep("selection");

            if (refetchSacrifices) {
                setTimeout(() => {
                    refetchSacrifices();
                }, 300);
            }
        }
    };
} 