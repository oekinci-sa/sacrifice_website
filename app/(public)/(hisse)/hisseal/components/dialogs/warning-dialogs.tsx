import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";

interface WarningDialogsProps {
    showThreeMinuteWarning: boolean;
    setShowThreeMinuteWarning: (show: boolean) => void;
    showOneMinuteWarning: boolean;
    setShowOneMinuteWarning: (show: boolean) => void;
    showInactivityWarning: boolean;
    inactivitySecondsLeft: number;
    handleDismissWarning: (warningType: "three-minute" | "one-minute") => void;
    getRemainingMinutesText: () => string;
    oneMinuteCountdown?: number;
}

export const WarningDialogs = ({
    showThreeMinuteWarning,
    showOneMinuteWarning,
    showInactivityWarning,
    inactivitySecondsLeft,
    handleDismissWarning,
    getRemainingMinutesText,
    oneMinuteCountdown,
}: WarningDialogsProps) => {
    const [localCountdown, setLocalCountdown] = useState<number>(oneMinuteCountdown ?? 59);

    // Start a local countdown when the 1-minute warning opens
    useEffect(() => {
        if (!showOneMinuteWarning) return;

        setLocalCountdown(oneMinuteCountdown ?? 59);

        const interval = setInterval(() => {
            setLocalCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [showOneMinuteWarning, oneMinuteCountdown]);
    return (
        <>
            {/* Inactivity warning — renders above session warnings via z-index */}
            {showInactivityWarning && (
                <div className="fixed inset-0 z-[60] flex items-start justify-center pt-4 pointer-events-none">
                    <div className="bg-amber-50 border border-amber-300 rounded-lg shadow-lg px-6 py-4 max-w-md pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-amber-800 font-semibold text-base">Hareketsizlik Uyarısı</p>
                        <p className="text-amber-700 text-sm mt-1">
                            <span className="font-bold tabular-nums">{inactivitySecondsLeft}</span> saniye içerisinde işlem yapmazsanız
                            oturumunuz sonlandırılacak ve rezervasyonunuz iptal edilecektir.
                        </p>
                    </div>
                </div>
            )}

            {/* 3-Minute warning dialog */}
            <AlertDialog
                open={showThreeMinuteWarning}
                onOpenChange={() => { }} // Disable clicking outside to close
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg">İşlem Süresi Uyarısı</AlertDialogTitle>
                        <AlertDialogDescription className="text-lg">
                            İşlem sürenizin dolmasına <span className="font-bold">{getRemainingMinutesText()}</span> kaldı.
                            Lütfen işleminizi tamamlayınız, aksi takdirde rezervasyonunuz iptal edilecek
                            ve hisse seçim sayfasına yönlendirileceksiniz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => handleDismissWarning("three-minute")}
                            className="text-base"
                        >
                            Anladım
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 1-Minute warning dialog */}
            <AlertDialog
                open={showOneMinuteWarning}
                onOpenChange={() => { }} // Disable clicking outside to close
            >
                <AlertDialogContent className="bg-red-50 dark:bg-red-950">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg text-red-700 dark:text-red-300">
                            Son Uyarı: İşlem Süresi Doluyor!
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-lg text-red-600 dark:text-red-400">
                            İşlem sürenizin dolmasına yalnızca <span className="font-bold">{getRemainingMinutesText()}</span> kaldı.
                            Lütfen işleminizi hemen tamamlayınız, aksi takdirde rezervasyonunuz iptal edilecek
                            ve tüm bilgileriniz silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => handleDismissWarning("one-minute")}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-base tabular-nums"
                        >
                            Acilen Tamamla ({localCountdown})
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}; 