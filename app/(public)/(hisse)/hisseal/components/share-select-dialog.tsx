"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sacrificeSchema } from "@/types";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { toast } = useToast();
  const [currentEmptyShare, setCurrentEmptyShare] = useState(sacrifice.empty_share);
  const [selectedCount, setSelectedCount] = useState<number | null>(null);

  useEffect(() => {
    // Reset selected count when dialog is closed
    if (!isOpen) {
      setSelectedCount(null);
    }

    // Reset current empty share when sacrifice changes
    setCurrentEmptyShare(sacrifice.empty_share);

    if (isOpen) {
      const channel = supabase.channel('sacrifice-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sacrifice_animals',
            filter: `sacrifice_id=eq.${sacrifice.sacrifice_id}`
          },
          (payload: any) => {
            const newEmptyShare = payload.new.empty_share;
            setCurrentEmptyShare(newEmptyShare);
            if (newEmptyShare === 0) {
              setSelectedCount(null);
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [sacrifice.sacrifice_id, isOpen]);

  const shareOptions = Array.from({ length: currentEmptyShare }, (_, i) => i + 1);

  const handleContinue = async () => {
    if (!selectedCount) return;

    // Boş hisse sayısını kontrol et
    const { data: latestSacrifice, error } = await supabase
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("sacrifice_id", sacrifice.sacrifice_id)
      .single();

    if (error || !latestSacrifice) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
      });
      return;
    }

    if (latestSacrifice.empty_share < selectedCount) {
      toast({
        variant: "destructive",
        title: "Uyarı",
        description: "Maalesef biraz önce bu kurbanlık ile ilgili yeni bir işlem yapıldı. Lütfen yeniden hisse adedi seçiniz.",
      });
      setSelectedCount(null);
      return;
    }

    toast({
      title: "Acele etmenize gerek yok",
      description: "Bilgilerinizi doldurduğunuz süre boyunca, seçtiğiniz hisseler sistem tarafından ayrılır ve başka kullanıcılar tarafından işleme açılamaz.",
      duration: 10000,
    });

    onSelect(selectedCount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center">Hisse Adedi Seçimi</DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          {currentEmptyShare === 0 ? (
            <div className={cn(
              "flex items-center gap-2 rounded-lg border p-4",
              "bg-destructive/15 text-destructive border-destructive/50"
            )}>
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                Üzgünüz, şu anda bu kurbanlıkta boş hisse kalmadı.
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-muted-foreground">
                Seçmiş olduğunuz <span className="text-primary font-medium">{sacrifice.share_price.toLocaleString('tr-TR')} ₺</span>'lik kurbanlıktan kaç adet hisse almak istersiniz?
              </p>
              <div className="grid grid-cols-7 gap-4 justify-center items-center max-w-[500px] mx-auto">
                {shareOptions.map((count) => (
                  <Button
                    key={count}
                    variant={selectedCount === count ? "default" : "outline"}
                    className="h-12 w-12 text-lg"
                    onClick={() => setSelectedCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Hissedar bilgilerini girmek için lütfen devam butonuna basınız.
                </p>
                <Button
                  onClick={handleContinue}
                  disabled={!selectedCount}
                >
                  Devam
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 