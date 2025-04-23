import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { GenericReservationMutation, ReservationStatus } from "@/types/reservation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

// Constants
const TIMEOUT_DURATION = 900; // 15 minutes in seconds (15 * 60)
const THREE_MINUTE_WARNING = 180; // 3 minutes in seconds 
const ONE_MINUTE_WARNING = 60; // 1 minute in seconds

// Define toast function type
type ToastFunction = {
    (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void;
};

interface UseReservationAndWarningManagerProps {
    reservationStatus?: {
        status: ReservationStatus;
        timeRemaining: number | null;
    } | null | undefined;
    shouldCheckStatus: boolean;
    createReservation: GenericReservationMutation;
    handleTimeoutRedirect: () => void;
    toast: ToastFunction;
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

    // Initialize Supabase client
    const supabase = createClientComponentClient();

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

    const handleTimeLeft = useCallback((timeLeftInSeconds: number) => {
        // Format time for display
        setRemainingTime(formatRemainingTime(timeLeftInSeconds));

        // Store exact warning times when we first start the timer
        if (startTimeRef.current !== null && exactWarningTimeRef.current.threeMinute === 0) {
            exactWarningTimeRef.current = {
                threeMinute: startTimeRef.current + ((TIMEOUT_DURATION - THREE_MINUTE_WARNING) * 1000),
                oneMinute: startTimeRef.current + ((TIMEOUT_DURATION - ONE_MINUTE_WARNING) * 1000)
            };
        }

        // Three-minute warning (only show once)
        if (timeLeftInSeconds <= THREE_MINUTE_WARNING &&
            !warningShownRef.current.threeMinute &&
            !showThreeMinuteWarning) {
            setShowThreeMinuteWarning(true);
            // Do not mark as shown yet - we'll do that when user dismisses
        }

        // One-minute warning (only show once, and not if permanently dismissed)
        if (timeLeftInSeconds <= ONE_MINUTE_WARNING &&
            !warningShownRef.current.oneMinute &&
            !showOneMinuteWarning &&
            !permanentlyDismissedOneMinuteWarning.current) {
            setShowOneMinuteWarning(true);
            // Do not mark as shown yet - we'll do that when user dismisses
        }

        // Timeout reached
        if (timeLeftInSeconds <= 0) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            startTimeRef.current = null;

            // Notify user and redirect
            toast({
                variant: "destructive",
                title: "İşlem Süresi Doldu",
                description: "İşlem süresi dolduğu için hisse seçim sayfasına yönlendiriliyorsunuz.",
            });

            handleTimeoutRedirect();
        }
    }, [
        formatRemainingTime,
        showThreeMinuteWarning,
        setShowThreeMinuteWarning,
        showOneMinuteWarning,
        setShowOneMinuteWarning,
        toast,
        handleTimeoutRedirect
    ]);

    // New function to fetch reservation expiry from the server
    const fetchReservationExpiry = useCallback(async (transactionId: string) => {
        if (!transactionId) return null;

        try {
            const response = await fetch(`/api/check-reservation-status?transaction_id=${transactionId}`);
            if (!response.ok) return null;

            const data = await response.json();

            if (data.status === "active" && data.expires_at) {
                // Calculate remaining time in seconds
                const expiresAt = new Date(data.expires_at).getTime();
                const now = Date.now();
                const timeLeftMs = Math.max(0, expiresAt - now);
                const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);

                return {
                    timeLeftSeconds,
                    expiresAt
                };
            }

            // If status is not active, signal that timeout should occur
            if (data.status === "expired") {
                return { timeLeftSeconds: 0, expiresAt: null };
            }

            return null;
        } catch (error) {
            console.error("Error fetching reservation status:", error);
            return null;
        }
    }, []);

    // New timer function that uses handleTimeLeft
    const updateTimer = useCallback(() => {
        if (startTimeRef.current === null) return;

        const now = Date.now();
        const elapsedMs = now - startTimeRef.current;
        const elapsedSeconds = elapsedMs / 1000;

        // Calculate remaining time
        const remainingSeconds = Math.max(0, timeLeft - elapsedSeconds);

        // Update time display and check for warnings
        handleTimeLeft(remainingSeconds);

        // Continue animation if time remains
        if (remainingSeconds > 0) {
            animationFrameRef.current = requestAnimationFrame(updateTimer);
        }
    }, [handleTimeLeft, timeLeft]);

    // Update countdown timer using requestAnimationFrame - legacy version
    // (Keep this for compatibility with existing code, but now use updateTimer)
    const updateCountdown = useCallback(() => {
        if (!startTimeRef.current || !reservationStatus?.timeRemaining) {
            return;
        }

        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - startTimeRef.current) / 1000;
        const initialRemainingSeconds = reservationStatus.timeRemaining;
        const remainingSeconds = Math.max(0, initialRemainingSeconds - elapsedSeconds);

        // Use the new handleTimeLeft function to handle all logic
        handleTimeLeft(remainingSeconds);

        // Continue animation is handled inside handleTimeLeft
        if (remainingSeconds > 0) {
            animationFrameRef.current = requestAnimationFrame(updateCountdown);
        }
    }, [reservationStatus?.timeRemaining, handleTimeLeft]);

    // Realtime subscription for reservation updates
    useEffect(() => {
        if (!currentTransactionId) return;

        // Başlangıçta mevcut durumu kontrol et
        fetchReservationExpiry(currentTransactionId).then(expiryData => {
            if (expiryData) {
                // Eğer süresi dolmuşsa, timeout işlemini başlat
                if (expiryData.timeLeftSeconds <= 0) {
                    handleTimeoutRedirect();
                    return;
                }

                // Değilse, zamanlayıcıyı bu süreye göre başlat
                startTimeRef.current = Date.now();
                setTimeLeft(expiryData.timeLeftSeconds);

                // ExactWarningTimeRef'i hesapla
                exactWarningTimeRef.current = {
                    threeMinute: Date.now() + ((expiryData.timeLeftSeconds - THREE_MINUTE_WARNING) * 1000),
                    oneMinute: Date.now() + ((expiryData.timeLeftSeconds - ONE_MINUTE_WARNING) * 1000)
                };

                // Update animation frame logic
                animationFrameRef.current = requestAnimationFrame(updateTimer);
            }
        });

        // Realtime subscription
        const subscription = supabase
            .channel(`reservation-${currentTransactionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reservation_transactions',
                    filter: `transaction_id=eq.${currentTransactionId}`
                },
                (payload) => {
                    const { new: newData } = payload;

                    // Rezervasyon durumu değiştiyse timeout kontrolü yap
                    if (newData.status === 'expired') {
                        toast({
                            variant: "destructive",
                            title: "Rezervasyon Süresi Doldu",
                            description: "Rezervasyon süreniz doldu. Başa dönülüyor."
                        });

                        handleTimeoutRedirect();
                    }

                    // Expires_at değiştiyse zamanlayıcıyı güncelle
                    if (newData.expires_at) {
                        const expiresAt = new Date(newData.expires_at).getTime();
                        const now = Date.now();
                        const timeLeftMs = Math.max(0, expiresAt - now);
                        const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);

                        startTimeRef.current = Date.now();
                        setTimeLeft(timeLeftSeconds);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [currentTransactionId, fetchReservationExpiry, handleTimeoutRedirect, toast, updateTimer, supabase]);

    // Initialize and clean up countdown timer for legacy code path
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
            // Use the standard pending and status properties from React Query
            // isPending is the correct property in React Query v5
            const isPendingState = createReservation.isPending === true;
            // For React Query v4 compatibility, fallback to isLoading and isFetching
            const isLoadingState = 'isLoading' in createReservation ? createReservation.isLoading === true : false;
            const isFetchingState = 'isFetching' in createReservation ? createReservation.isFetching === true : false;

            const isLoading = isPendingState || isLoadingState || isFetchingState || false;

            if (isLoading) {
                setIsReservationLoading(true);
            } else {
                const timer = setTimeout(() => setIsReservationLoading(false), 300);
                return () => clearTimeout(timer);
            }
        } catch {
            setIsReservationLoading(false);
        }
    }, [createReservation]);

    // A diagnostic test function that can be called to verify the API endpoint
    const testExpireReservation = useCallback((testTransactionId: string) => {
        fetch('/api/expire-reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transaction_id: testTransactionId }),
        })
            .then(response => response.json())
            .then(() => {
            })
            .catch(() => {
            });
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
        fetchReservationExpiry, // Expose the new function

        // Constants
        TIMEOUT_DURATION,
        WARNING_THRESHOLD: ONE_MINUTE_WARNING
    };
}