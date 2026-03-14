"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CheckoutDialogsProps {
  showBackDialog: boolean;
  setShowBackDialog: (show: boolean) => void;
  showLastShareDialog: boolean;
  setShowLastShareDialog: (show: boolean) => void;
  isCanceling: boolean;
  cancelReservation: { isPending?: boolean };
  confirmBack: () => Promise<void>;
  cancelBack: () => void;
  handleLastShareAction: (action: "return" | "stay") => Promise<void>;
}

export function CheckoutDialogs({
  showBackDialog,
  setShowBackDialog,
  showLastShareDialog,
  setShowLastShareDialog,
  isCanceling,
  cancelReservation,
  confirmBack,
  cancelBack,
  handleLastShareAction,
}: CheckoutDialogsProps) {
  return (
    <>
      <AlertDialog open={showBackDialog} onOpenChange={setShowBackDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader className="space-y-4 md:space-y-6">
            <AlertDialogTitle className="text-lg md:text-xl font-semibold">
              Emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base md:text-lg leading-relaxed">
              Eğer geri dönerseniz, yaptığınız değişiklikler kaybolacaktır.
              Ayrıca, daha önce seçmiş olduğunuz hisseler başkaları tarafından
              seçilebilir hale gelecektir. Devam etmek istediğinize emin
              misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col md:flex-row gap-2 md:gap-4 pt-4 md:pt-6">
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 md:h-12 text-base md:text-lg"
              onClick={confirmBack}
              disabled={isCanceling || cancelReservation.isPending}
            >
              {isCanceling || cancelReservation.isPending
                ? "İşleminiz yapılıyor..."
                : "Evet, geri dönmek istiyorum"}
            </AlertDialogAction>
            <AlertDialogCancel
              className="flex-1 h-10 md:h-12 text-base md:text-lg"
              onClick={cancelBack}
              disabled={isCanceling || cancelReservation.isPending}
            >
              Hayır, bu sayfada kalmak istiyorum
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLastShareDialog} onOpenChange={setShowLastShareDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader className="space-y-6">
            <AlertDialogTitle className="text-xl font-semibold">
              Uyarı
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              Formdaki son hisseyi silemezsiniz. Lütfen yapmak istediğiniz
              işlemi seçiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-col-reverse gap-2 pt-6 md:flex-row md:justify-end md:gap-4">
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleLastShareAction("return")}
              disabled={isCanceling || cancelReservation.isPending}
            >
              {isCanceling || cancelReservation.isPending
                ? "İşleminiz yapılıyor..."
                : "Hisse Seçim Ekranına Dön"}
            </AlertDialogAction>

            <AlertDialogCancel
              className="flex-1"
              onClick={() => handleLastShareAction("stay")}
              disabled={isCanceling || cancelReservation.isPending}
            >
              Bu sayfada kal
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
