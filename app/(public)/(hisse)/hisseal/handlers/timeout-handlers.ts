// Define toast function type
type ToastFunction = {
    (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void;
};

interface CustomTimeoutHandlerProps {
    /** Session timeout ile AYNI redirect akışı — buton tıklanamama sorununu önler */
    performRedirect: () => Promise<unknown>;
    setShowWarning: (show: boolean) => void;
    setIsDialogOpen: (open: boolean) => void;
    setShowReservationInfo: (show: boolean) => void;
    setShowThreeMinuteWarning: (show: boolean) => void;
    setShowOneMinuteWarning: (show: boolean) => void;
    setCameFromTimeout: (timeout: boolean) => void;
    toast: ToastFunction;
}

export const createHandleCustomTimeout = ({
    performRedirect,
    setShowWarning,
    setIsDialogOpen,
    setShowReservationInfo,
    setShowThreeMinuteWarning,
    setShowOneMinuteWarning,
    setCameFromTimeout,
    toast
}: CustomTimeoutHandlerProps) => {
    return async () => {
        setShowWarning(false);
        setIsDialogOpen(false);
        setShowReservationInfo(false);
        setShowThreeMinuteWarning(false);
        setShowOneMinuteWarning(false);
        setCameFromTimeout(true);

        // Session timeout ile aynı akış — API, resetStore, goToStep, router.refresh hepsi burada
        await performRedirect();

        toast({ title: "İşlem Süresi Doldu", description: "Hareketsizlik nedeniyle oturumunuz sonlandırıldı." });
    };
}; 