import { useCallback, useEffect, useState } from "react";

// Define ReservationStatus enum since it's not in @/types
export enum ReservationStatus {
    ACTIVE = "active",
    PENDING = "pending",
    EXPIRED = "expired"
}

// Define constant values
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
const THREE_MINUTE_WARNING = 3 * 60 * 1000; // 3 minutes in milliseconds
const ONE_MINUTE_WARNING = 1 * 60 * 1000; // 1 minute in milliseconds
const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const COUNTDOWN_INTERVAL = 1000; // 1 second

// Define toast function type
type ToastFunction = {
    (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void;
};

// Define type for reservation status
interface ReservationStatusData {
    status: ReservationStatus | string;
    timeRemaining: number | null;
    transaction_id?: string;
}

// Define the interface for the hook props
interface UseReservationAndWarningManagerProps {
    reservationStatus: ReservationStatusData | null | undefined;
    shouldCheckStatus: boolean;
    createReservation: {
        mutate: (data: unknown) => Promise<void>;
        reset?: () => void;
        isPending?: boolean;
        isLoading?: boolean;
        isFetching?: boolean;
    };
    handleTimeoutRedirect: () => void;
    toast: ToastFunction;
}

// The main hook
export function useReservationAndWarningManager({
    reservationStatus,
    shouldCheckStatus,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createReservation,
    handleTimeoutRedirect,
    toast,
}: UseReservationAndWarningManagerProps) {
    // Internal states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION);
    const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
    const [showWarning, setShowWarning] = useState(false);
    const [isReservationLoading, setIsReservationLoading] = useState(false);
    const [showReservationInfo, setShowReservationInfo] = useState(false);
    const [cameFromTimeout, setCameFromTimeout] = useState(false);
    const [showThreeMinuteWarning, setShowThreeMinuteWarning] = useState(false);
    const [showOneMinuteWarning, setShowOneMinuteWarning] = useState(false);

    // Format remaining time for display in warnings
    const getRemainingMinutesText = useCallback(() => {
        const minutes = Math.ceil(timeLeft / 60000);
        if (minutes <= 1) return "1 dakika";
        return `${minutes} dakika`;
    }, [timeLeft]);

    // Handle server-based reservation status
    useEffect(() => {
        if (shouldCheckStatus && reservationStatus) {
            // If server reports an active reservation
            if (reservationStatus.status === ReservationStatus.ACTIVE && reservationStatus.timeRemaining !== null) {
                console.log(`Server reservation remaining: ${reservationStatus.timeRemaining}ms`);

                // Update our time left based on the server's remaining time
                // But never increase the time from what we have locally
                if (reservationStatus.timeRemaining < timeLeft) {
                    setTimeLeft(reservationStatus.timeRemaining);
                }

                // Update last interaction time to now, as we've just checked
                setLastInteractionTime(Date.now());
            }

            // Set loading state based on status
            setIsReservationLoading(reservationStatus.status === ReservationStatus.PENDING);
        }
    }, [reservationStatus, shouldCheckStatus, timeLeft]);

    // Countdown timer effect
    useEffect(() => {
        // Start the countdown only if dialog is open or reservation info is shown
        if (!isDialogOpen && !showReservationInfo) return;

        // Use NodeJS.Timeout type instead of any
        let countdownId: NodeJS.Timeout | null = null;

        const updateTimeLeft = () => {
            const elapsed = Date.now() - lastInteractionTime;
            const remaining = Math.max(0, TIMEOUT_DURATION - elapsed);

            setTimeLeft(remaining);

            // Show warning if time is running low
            if (remaining <= WARNING_THRESHOLD && remaining > 0) {
                setShowWarning(true);

                // Show specific warnings at certain thresholds
                if (remaining <= THREE_MINUTE_WARNING && remaining > THREE_MINUTE_WARNING - 10000) {
                    setShowThreeMinuteWarning(true);
                }

                if (remaining <= ONE_MINUTE_WARNING && remaining > ONE_MINUTE_WARNING - 10000) {
                    setShowOneMinuteWarning(true);
                }
            }

            // Handle timeout
            if (remaining === 0) {
                if (countdownId) clearInterval(countdownId);

                // Auto-expire the reservation on the server
                if (reservationStatus?.status === ReservationStatus.ACTIVE && reservationStatus.transaction_id) {
                    try {
                        // Update status on server
                        fetch('/api/expire-reservation', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ transaction_id: reservationStatus.transaction_id }),
                        });
                    } catch (error) {
                        console.error("Error expiring reservation:", error);
                    }
                }

                // Redirect the user
                handleTimeoutRedirect();

                // Reset all warnings and dialogs
                setShowWarning(false);
                setShowThreeMinuteWarning(false);
                setShowOneMinuteWarning(false);
                setIsDialogOpen(false);
                setShowReservationInfo(false);

                // Show timeout notification
                toast({
                    variant: "destructive",
                    title: "Zaman Aşımı",
                    description: "İşlem süresi doldu. Lütfen tekrar deneyin.",
                });
            }
        };

        // Initial update
        updateTimeLeft();

        // Set up interval
        countdownId = setInterval(updateTimeLeft, COUNTDOWN_INTERVAL);

        // Clean up
        return () => {
            if (countdownId) clearInterval(countdownId);
        };
    }, [
        isDialogOpen,
        showReservationInfo,
        lastInteractionTime,
        handleTimeoutRedirect,
        reservationStatus,
        toast
    ]);

    // Handle dismissing warnings
    const handleDismissWarning = useCallback((warningType: "three-minute" | "one-minute" = "three-minute") => {
        if (warningType === "three-minute") {
            setShowThreeMinuteWarning(false);
        } else if (warningType === "one-minute") {
            setShowOneMinuteWarning(false);
        }
    }, []);

    // Return everything needed for reservation and warning management
    return {
        isDialogOpen,
        setIsDialogOpen,
        timeLeft,
        setTimeLeft,
        lastInteractionTime,
        setLastInteractionTime,
        showWarning,
        setShowWarning,
        isReservationLoading,
        showReservationInfo,
        setShowReservationInfo,
        cameFromTimeout,
        setCameFromTimeout,
        showThreeMinuteWarning,
        setShowThreeMinuteWarning,
        showOneMinuteWarning,
        setShowOneMinuteWarning,
        getRemainingMinutesText,
        handleDismissWarning,
        TIMEOUT_DURATION,
        WARNING_THRESHOLD
    };
} 