"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sacrificeSchema } from "@/types";

interface ShareSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sacrifice: sacrificeSchema;
  onSelect: (shareCount: number) => void;
}

export function ShareSelectDialog({
  isOpen,
  onClose,
  sacrifice,
  onSelect,
}: ShareSelectDialogProps) {
  const shareOptions = Array.from({ length: sacrifice.empty_share }, (_, i) => i + 1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Hisse Bilgileri Girişi</DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          <p className="text-center text-muted-foreground">
            Kaç adet hisse almak istersiniz?
          </p>
          <div className="flex justify-center gap-4">
            {shareOptions.map((count) => (
              <Button
                key={count}
                variant="outline"
                className="h-12 w-12 text-lg"
                onClick={() => onSelect(count)}
              >
                {count}
              </Button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Girdiğiniz hisse sayısı, sonraki adıma geçtiğinizde onay için görünecektir.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 