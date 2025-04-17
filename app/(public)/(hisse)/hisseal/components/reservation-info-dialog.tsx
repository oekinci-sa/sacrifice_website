"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircleIcon, ClockIcon, InfoIcon } from "lucide-react";

interface ReservationInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReservationInfoDialog({ isOpen, onClose }: ReservationInfoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Rezervasyon Bilgisi</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          {/* Main reservation info */}
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Acele etmenize gerek yok</AlertTitle>
            <AlertDescription>
              Bilgilerinizi doldurduğunuz süre boyunca, seçtiğiniz hisseler sistem tarafından ayrılır ve
              başka kullanıcılar tarafından işleme açılamaz.
            </AlertDescription>
          </Alert>

          {/* Timeout warning */}
          <Alert variant="default" className="border-yellow-500">
            <ClockIcon className="h-4 w-4 text-yellow-500" />
            <AlertTitle>Oturum süresi</AlertTitle>
            <AlertDescription>
              3 dakika boyunca işlem yapılmadığı takdirde oturumunuz sonlandırılacak ve rezervasyonunuz iptal edilecektir.
            </AlertDescription>
          </Alert>

          {/* Reservation expiration warning */}
          <Alert variant="destructive" className="bg-white">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>İşlem süresi</AlertTitle>
            <AlertDescription>
              Toplam işlem süresi 15 dakikadır. Bu süre içinde formu doldurup
              işlemi tamamlamazsanız, rezervasyonunuz otomatik olarak iptal edilecektir.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Anladım, Devam Et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 