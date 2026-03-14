import { TIMEOUT_DURATION, INACTIVITY_TIMEOUT, INACTIVITY_WARNING_THRESHOLD, THREE_MINUTE_WARNING, ONE_MINUTE_WARNING } from "@/lib/constants/reservation-timer";
import { GenericReservationMutation, ReservationStatus } from "@/types/reservation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchReservationExpiry as fetchReservationExpiryUtil, formatRemainingTime as formatRemainingTimeUtil } from "./reservation-timer-utils";

// Define toast function type
type ToastFunction = {
    (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void;
};

interface UseReservationAndWarningManagerProps {
    transactionId: string;
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
    transactionId,
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
    const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState(INACTIVITY_TIMEOUT);
    const [isReservationLoading, setIsReservationLoading] = useState(false);
    const [showReservationInfo, setShowReservationInfo] = useState(false);
    const [cameFromTimeout, setCameFromTimeout] = useState(false);
    const [showThreeMinuteWarning, setShowThreeMinuteWarning] = useState(false);
    const [showOneMinuteWarning, setShowOneMinuteWarning] = useState(false);
    const [remainingTime, setRemainingTime] = useState<string>("15:00");

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
    const timerBaseSecondsRef = useRef<number>(TIMEOUT_DURATION);
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
                permanentlyDismissedOneMinuteWarning.current = true;
            }
        },
        []
    );

    const formatRemainingTime = useCallback((seconds: number) => formatRemainingTimeUtil(seconds), []);

    const handleTimeLeft = useCallback((timeLeftInSeconds: number) => {
        const s = Math.max(0, Math.ceil(timeLeftInSeconds));

        setTimeLeft(s);
        setRemainingTime(formatRemainingTime(s));

        // --- Session warning logic ---
        // Rule: show THREE_MINUTE_WARNING once when time drops to that threshold.
        // Rule: when ONE_MINUTE_WARNING threshold is reached:
        //   - If THREE_MINUTE_WARNING is still open (user didn't dismiss), close it first, then show ONE_MINUTE_WARNING.
        //   - If THREE_MINUTE_WARNING was already dismissed by user, show ONE_MINUTE_WARNING.
        //   - If ONE_MINUTE_WARNING was permanently dismissed, do nothing.

        if (s <= THREE_MINUTE_WARNING && !warningShownRef.current.threeMinute) {
            setShowThreeMinuteWarning(true);
        }

        if (s <= ONE_MINUTE_WARNING && !warningShownRef.current.oneMinute && !permanentlyDismissedOneMinuteWarning.current) {
            if (!warningShownRef.current.threeMinute) {
                // 15-sec warning still open — close it first, then show 10-sec warning
                setShowThreeMinuteWarning(false);
                warningShownRef.current.threeMinute = true;
            }
            setShowOneMinuteWarning(true);
        }

        // Session timer expired — redirect unconditionally
        if (s <= 0) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            startTimeRef.current = null;

            toast({
                variant: "destructive",
                title: "İşlem Süresi Doldu",
                description: "İşlem süresi dolduğu için hisse seçim sayfasına yönlendiriliyorsunuz.",
            });

            setShowThreeMinuteWarning(false);
            setShowOneMinuteWarning(false);
            setShowWarning(false); // Inactivity uyarı banner'ını da kapat

            // Defer: React commit tamamlansın — session timeout sonrası Hisse Al butonu tıklanabilir kalmalı
            setTimeout(() => handleTimeoutRedirect(), 0);
        }
    }, [formatRemainingTime, toast, handleTimeoutRedirect]);

    const fetchReservationExpiry = useCallback(
        (transactionId: string) => fetchReservationExpiryUtil(transactionId),
        []
    );

    // CRITICAL: This function resets ALL timer state to a fresh 15-min session.
    // It runs automatically when transactionId or shouldCheckStatus changes (see
    // useEffect below). Do NOT modify its dependency array or remove any of the
    // ref/state resets — doing so causes the timer to carry over stale values
    // from a previous reservation session.
    const lastDisplayedSecondRef = useRef<number>(-1);

    const resetSessionTimerState = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        lastDisplayedSecondRef.current = -1;
        startTimeRef.current = null;
        timerBaseSecondsRef.current = TIMEOUT_DURATION;
        warningShownRef.current = { threeMinute: false, oneMinute: false };
        permanentlyDismissedOneMinuteWarning.current = false;
        exactWarningTimeRef.current = { threeMinute: 0, oneMinute: 0 };
        setTimeLeft(TIMEOUT_DURATION);
        setRemainingTime(formatRemainingTime(TIMEOUT_DURATION));
        setShowThreeMinuteWarning(false);
        setShowOneMinuteWarning(false);
    }, [formatRemainingTime]);

    // New timer function that uses handleTimeLeft
    const updateTimer = useCallback(() => {
        if (startTimeRef.current === null) return;

        const now = Date.now();
        const elapsedMs = now - startTimeRef.current;
        const elapsedSeconds = elapsedMs / 1000;

        // Calculate remaining time
        const remainingSeconds = Math.max(0, timerBaseSecondsRef.current - elapsedSeconds);
        const displaySecond = Math.ceil(remainingSeconds);

        // Only update state when the displayed second changes — throttles from ~60fps to 1/sec
        // to prevent timer flicker on keyboard/mouse interaction
        if (displaySecond !== lastDisplayedSecondRef.current) {
            lastDisplayedSecondRef.current = displaySecond;
            handleTimeLeft(remainingSeconds);
        }

        // Continue animation if time remains
        if (remainingSeconds > 0) {
            animationFrameRef.current = requestAnimationFrame(updateTimer);
        }
    }, [handleTimeLeft]);

    useEffect(() => {
        resetSessionTimerState();
    }, [transactionId, shouldCheckStatus, resetSessionTimerState]);

    // Realtime subscription for reservation updates
    useEffect(() => {
        if (!transactionId || !shouldCheckStatus) return;

        let isCancelled = false;
        let retryTimer: ReturnType<typeof setTimeout> | undefined;

        const startTimerFromExpiryData = (timeLeftSeconds: number) => {
            startTimeRef.current = Date.now();
            timerBaseSecondsRef.current = timeLeftSeconds;
            setTimeLeft(timeLeftSeconds);

            exactWarningTimeRef.current = {
                threeMinute: Date.now() + ((timeLeftSeconds - THREE_MINUTE_WARNING) * 1000),
                oneMinute: Date.now() + ((timeLeftSeconds - ONE_MINUTE_WARNING) * 1000)
            };

            animationFrameRef.current = requestAnimationFrame(updateTimer);
        };

        const bootstrapReservationTimer = async (attempt = 0) => {
            const expiryData = await fetchReservationExpiry(transactionId);

            if (isCancelled) {
                return;
            }

            if (!expiryData) {
                if (attempt < 4) {
                    retryTimer = setTimeout(() => {
                        void bootstrapReservationTimer(attempt + 1);
                    }, 400);
                }
                return;
            }

            if (expiryData.timeLeftSeconds <= 0) {
                setShowWarning(false);
                setIsDialogOpen(false);
                setShowReservationInfo(false);
                setShowThreeMinuteWarning(false);
                setShowOneMinuteWarning(false);
                setTimeout(() => handleTimeoutRedirect(), 0);
                return;
            }

            startTimerFromExpiryData(expiryData.timeLeftSeconds);
        };

        void bootstrapReservationTimer();

        // Realtime subscription
        const subscription = supabase
            .channel(`reservation-${transactionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reservation_transactions',
                    filter: `transaction_id=eq.${transactionId}`
                },
                (payload) => {
                    const { new: newData } = payload;

                    // Rezervasyon durumu değiştiyse timeout kontrolü yap
                    if (newData.status === 'expired') {
                        setShowWarning(false);
                        setIsDialogOpen(false);
                        setShowReservationInfo(false);
                        setShowThreeMinuteWarning(false);
                        setShowOneMinuteWarning(false);

                        toast({
                            variant: "destructive",
                            title: "Rezervasyon Süresi Doldu",
                            description: "Rezervasyon süreniz doldu. Başa dönülüyor."
                        });

                        setTimeout(() => handleTimeoutRedirect(), 0);
                        return;
                    }

                    // Expires_at değiştiyse zamanlayıcıyı güncelle
                    if (newData.expires_at) {
                        const expiresAt = new Date(newData.expires_at).getTime();
                        const now = Date.now();
                        const timeLeftMs = Math.max(0, expiresAt - now);
                        const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);

                        startTimeRef.current = Date.now();
                        timerBaseSecondsRef.current = timeLeftSeconds;
                        setTimeLeft(timeLeftSeconds);
                        animationFrameRef.current = requestAnimationFrame(updateTimer);
                    }
                }
            )
            .subscribe();

        return () => {
            isCancelled = true;
            if (retryTimer) {
                clearTimeout(retryTimer);
            }
            supabase.removeChannel(subscription);
        };
    }, [transactionId, shouldCheckStatus, fetchReservationExpiry, handleTimeoutRedirect, toast, updateTimer, supabase]);

    // Handle reservation status changes
    useEffect(() => {
        if (!reservationStatus || !shouldCheckStatus) return;

        if (reservationStatus.status === ReservationStatus.EXPIRED) {
            // Close all dialogs
            setShowWarning(false);
            setIsDialogOpen(false);
            setShowReservationInfo(false);
            setShowThreeMinuteWarning(false);
            setShowOneMinuteWarning(false);

            toast({
                variant: "destructive",
                title: "İşlem Süresi Doldu",
                description: "İşlem süresi dolduğu için hisse seçim sayfasına yönlendiriliyorsunuz.",
            });

            setTimeout(() => handleTimeoutRedirect(), 0);
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
        inactivitySecondsLeft,
        setInactivitySecondsLeft,
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

        // Functions
        getRemainingMinutesText: () => remainingTime,
        handleDismissWarning,
        testExpireReservation, // For debugging only
        fetchReservationExpiry, // Expose the new function

        // Constants (inactivity timer için — session timer'dan bağımsız)
        INACTIVITY_TIMEOUT,
        INACTIVITY_WARNING_THRESHOLD,
        SESSION_TIMEOUT_DURATION: TIMEOUT_DURATION
    };
}