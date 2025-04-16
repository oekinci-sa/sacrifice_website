import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WarningDialogsProps {
    showThreeMinuteWarning: boolean;
    setShowThreeMinuteWarning: (show: boolean) => void;
    showOneMinuteWarning: boolean;
    setShowOneMinuteWarning: (show: boolean) => void;
    handleDismissWarning: (warningType: "three-minute" | "one-minute") => void;
    getRemainingMinutesText: () => string;
}

export const WarningDialogs = ({
    showThreeMinuteWarning,
    setShowThreeMinuteWarning,
    showOneMinuteWarning,
    setShowOneMinuteWarning,
    handleDismissWarning,
    getRemainingMinutesText,
}: WarningDialogsProps) => {
    return (
        <>
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
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-base"
                        >
                            Acilen Tamamla
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}; 