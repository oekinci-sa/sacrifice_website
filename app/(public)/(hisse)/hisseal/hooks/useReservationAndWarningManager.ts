import { ReservationStatus } from "@/hooks/useReservations";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { useCallback, useEffect, useRef, useState } from "react";

// Constants
const TIMEOUT_DURATION = 180; // 15 minutes in seconds (15 * 60)
const THREE_MINUTE_WARNING = 180; // 3 minutes in seconds 
const ONE_MINUTE_WARNING = 60; // 1 minute in seconds

interface UseReservationAndWarningManagerProps {
    reservationStatus: {
        status: ReservationStatus;
        timeRemaining: number | null;
    } | null | undefined;
    shouldCheckStatus: boolean;
    createReservation: any;
    handleTimeoutRedirect: () => void;
    toast: any;
}

export function useReservationAndWarningManager({
    reservationStatus,
    shouldCheckStatus,
    createReservation,
    handleTimeoutRedirect,
    toast,
}: UseReservationAndWarningManagerProps) {
    // Dialog and warning states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION);
    const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
    const [showWarning, setShowWarning] = useState(false);
    const [isReservationLoading, setIsReservationLoading] = useState(false);
    const [showReservationInfo, setShowReservationInfo] = useState(false);
    const [cameFromTimeout, setCameFromTimeout] = useState(false);
    const [showThreeMinuteWarning, setShowThreeMinuteWarning] = useState(false);
    const [showOneMinuteWarning, setShowOneMinuteWarning] = useState(false);
    const [remainingTime, setRemainingTime] = useState<string>("15:00");

    // Track the current transaction ID to ensure it's available when needed
    const [currentTransactionId, setCurrentTransactionId] = useState<string>("");

    // Refs for tracking warning states and animation frame
    const warningShownRef = useRef({
        threeMinute: false,
        oneMinute: false
    });
    // Permanent flag to track if one-minute warning was dismissed (won't reset between status updates)
    const permanentlyDismissedOneMinuteWarning = useRef(false);
    const animationFrameRef = useRef<number>();
    const startTimeRef = useRef<number | null>(null);
    const exactWarningTimeRef = useRef({
        threeMinute: 0,
        oneMinute: 0
    });

    // Handler for dismissing expiration warnings
    const handleDismissWarning = useCallback(
        (warningType: "three-minute" | "one-minute") => {
            if (warningType === "three-minute") {
                setShowThreeMinuteWarning(false);
                warningShownRef.current.threeMinute = true;
            } else {
                setShowOneMinuteWarning(false);
                warningShownRef.current.oneMinute = true;
                // Set permanent flag to prevent showing this warning again in current session
                permanentlyDismissedOneMinuteWarning.current = true;
            }
        },
        []
    );

    // Calculate remaining time in MM:SS format
    const formatRemainingTime = useCallback((seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, []);

    // Update countdown timer using requestAnimationFrame
    const updateCountdown = useCallback(() => {
        if (!startTimeRef.current || !reservationStatus?.timeRemaining) {
            return;
        }

        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - startTimeRef.current) / 1000;
        const initialRemainingSeconds = reservationStatus.timeRemaining;
        const remainingSeconds = Math.max(0, initialRemainingSeconds - elapsedSeconds);

        // Update the formatted time string
        setRemainingTime(formatRemainingTime(remainingSeconds));

        // Handle 3-minute warning precisely at exactly 3 minutes
        if (!warningShownRef.current.threeMinute &&
            remainingSeconds <= THREE_MINUTE_WARNING &&
            remainingSeconds > THREE_MINUTE_WARNING - 1) {

            // Set exact warning time once
            if (exactWarningTimeRef.current.threeMinute === 0) {
                exactWarningTimeRef.current.threeMinute = Math.ceil(remainingSeconds);
            }

            // Show warning only when we're at the exact warning threshold
            if (Math.ceil(remainingSeconds) === exactWarningTimeRef.current.threeMinute) {
                setShowThreeMinuteWarning(true);
                setShowOneMinuteWarning(false);
            }
        }

        // Handle 1-minute warning precisely at exactly 1 minute
        else if (!warningShownRef.current.oneMinute &&
            !permanentlyDismissedOneMinuteWarning.current &&
            remainingSeconds <= ONE_MINUTE_WARNING &&
            remainingSeconds > ONE_MINUTE_WARNING - 1) {

            // Set exact warning time once
            if (exactWarningTimeRef.current.oneMinute === 0) {
                exactWarningTimeRef.current.oneMinute = Math.ceil(remainingSeconds);
            }

            // Show warning only when we're at the exact warning threshold
            if (Math.ceil(remainingSeconds) === exactWarningTimeRef.current.oneMinute) {
                // Auto-close 3-minute warning if it's still showing
                if (showThreeMinuteWarning) {
                    setShowThreeMinuteWarning(false);
                    warningShownRef.current.threeMinute = true;
                }

                setShowOneMinuteWarning(true);
            }
        }

        // Continue animation if time remains
        if (remainingSeconds > 0) {
            animationFrameRef.current = requestAnimationFrame(updateCountdown);
        } else {
            // Expire the reservation in the database
            if (reservationStatus?.status !== ReservationStatus.EXPIRED && currentTransactionId) {
                // Log the transaction ID to help with debugging
                console.log('Expiring reservation with transaction_id:', currentTransactionId);

                // Call the expire-reservation endpoint
                fetch('/api/expire-reservation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ transaction_id: currentTransactionId }),
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to expire reservation: ${response.status} ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Reservation expired successfully:', data);
                        // Redirect user AFTER the API call succeeds
                        setTimeout(() => {
                            handleTimeoutRedirect();
                        }, 100); // Small delay to ensure DB update is complete
                    })
                    .catch(error => {
                        console.error('Error expiring reservation:', error);

                        // Show a toast notification to the user
                        toast({
                            variant: "destructive",
                            title: "Sistem Hatası",
                            description: "Rezervasyon durumu güncellenirken bir sorun oluştu. Lütfen sayfayı yenileyiniz."
                        });

                        // Still redirect the user after showing the error
                        setTimeout(() => {
                            handleTimeoutRedirect();
                        }, 500); // Longer delay to allow user to see the error
                    });
            } else {
                // Handle timeout without API call if no transaction_id or already expired
                console.log('No API call needed for expiration. Status:', reservationStatus?.status,
                    'Transaction ID:', currentTransactionId);
                handleTimeoutRedirect();
            }
        }
    }, [reservationStatus?.timeRemaining, reservationStatus?.status, formatRemainingTime, handleTimeoutRedirect, showThreeMinuteWarning, toast, currentTransactionId]);

    // Initialize and clean up countdown timer
    useEffect(() => {
        if (reservationStatus?.timeRemaining && shouldCheckStatus) {
            startTimeRef.current = Date.now();

            // Initialize default remaining time to full value from server
            if (reservationStatus.timeRemaining) {
                setRemainingTime(formatRemainingTime(reservationStatus.timeRemaining));
            }

            // Reset warning flags and times when receiving new reservation status
            warningShownRef.current = { threeMinute: false, oneMinute: false };
            exactWarningTimeRef.current = { threeMinute: 0, oneMinute: 0 };

            // Store the current transaction ID
            const storeTransactionId = useReservationIDStore.getState().transaction_id;
            setCurrentTransactionId(storeTransactionId);
            console.log('Initializing countdown with transaction_id:', storeTransactionId);

            animationFrameRef.current = requestAnimationFrame(updateCountdown);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [reservationStatus?.timeRemaining, shouldCheckStatus, updateCountdown, formatRemainingTime]);

    // Handle reservation status changes
    useEffect(() => {
        if (!reservationStatus || !shouldCheckStatus) return;

        if (reservationStatus.status === ReservationStatus.EXPIRED) {
            // Close all dialogs
            setIsDialogOpen(false);
            setShowReservationInfo(false);
            setShowThreeMinuteWarning(false);
            setShowOneMinuteWarning(false);

            toast({
                variant: "destructive",
                title: "İşlem Süresi Doldu",
                description: "İşlem süresi dolduğu için hisse seçim sayfasına yönlendiriliyorsunuz.",
            });

            handleTimeoutRedirect();
        }
    }, [reservationStatus, shouldCheckStatus, handleTimeoutRedirect, toast]);

    // Handle reservation loading state
    useEffect(() => {
        try {
            const pendingState = createReservation.isPending === true;
            const loadingState = createReservation.isLoading === true;
            const fetchingState = createReservation.isFetching === true;
            const isLoading = pendingState || loadingState || fetchingState || false;

            if (isLoading) {
                setIsReservationLoading(true);
            } else {
                const timer = setTimeout(() => setIsReservationLoading(false), 300);
                return () => clearTimeout(timer);
            }
        } catch (error) {
            console.warn("React Query loading state check failed:", error);
            setIsReservationLoading(false);
        }
    }, [createReservation]);

    // A diagnostic test function that can be called to verify the API endpoint
    const testExpireReservation = useCallback((testTransactionId: string) => {
        console.log('Running test expire reservation with ID:', testTransactionId);

        fetch('/api/expire-reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transaction_id: testTransactionId }),
        })
            .then(response => response.json())
            .then(data => console.log('TEST RESPONSE:', data))
            .catch(err => console.error('TEST ERROR:', err));
    }, []);

    return {
        // State variables
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
        remainingTime,
        currentTransactionId,
        setCurrentTransactionId,

        // Functions
        getRemainingMinutesText: () => remainingTime,
        handleDismissWarning,
        testExpireReservation, // For debugging only

        // Constants
        TIMEOUT_DURATION,
        WARNING_THRESHOLD: ONE_MINUTE_WARNING
    };
} 