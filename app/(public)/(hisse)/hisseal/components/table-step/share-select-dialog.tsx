"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sacrificeSchema } from "@/types";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReservationStore } from "@/stores/useReservationStore";

interface ShareSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sacrifice: sacrificeSchema;
  onSelect: (shareCount: number) => void;
  isLoading?: boolean;
}

export function ShareSelectDialog({
  isOpen,
  onClose,
  sacrifice,
  onSelect,
  isLoading = false,
}: ShareSelectDialogProps) {
  const { toast } = useToast();
  const [currentEmptyShare, setCurrentEmptyShare] = useState(sacrifice.empty_share);
  const [selectedShareCount, setSelectedShareCount] = useState(1);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const generateNewTransactionId = useReservationStore(state => state.generateNewTransactionId);
  
  const isButtonLoading = isLoading || isLocalLoading;

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentEmptyShare(sacrifice.empty_share);
      setSelectedShareCount(1);
      setIsLocalLoading(false);
      
      // Dialog açıldığında yeni bir transaction ID oluştur
      generateNewTransactionId();
      console.log('Generated new transaction ID when dialog opened:', 
        useReservationStore.getState().transaction_id);
    }
  }, [isOpen, sacrifice.empty_share, generateNewTransactionId]);

  useEffect(() => {
    // Reset selected count when dialog is closed
    if (!isOpen) {
      setSelectedShareCount(1);
    }

    // Reset current empty share when sacrifice changes
    setCurrentEmptyShare(sacrifice.empty_share);

    if (isOpen) {
      const channel = supabase
        .channel("sacrifice-updates")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sacrifice_animals",
            filter: `sacrifice_id=eq.${sacrifice.sacrifice_id}`,
          },
          (payload: { new: { empty_share: number } }) => {
            const newEmptyShare = payload.new.empty_share;
            setCurrentEmptyShare(newEmptyShare);
            if (newEmptyShare === 0) {
              setSelectedShareCount(1);
            } else if (selectedShareCount > newEmptyShare) {
              setSelectedShareCount(newEmptyShare);
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [sacrifice.sacrifice_id, sacrifice.empty_share, isOpen, selectedShareCount]);

  const shareOptions = Array.from(
    { length: currentEmptyShare },
    (_, i) => i + 1
  );

  const handleContinue = async () => {
    setIsLocalLoading(true);
    
    try {
      // Boş hisse sayısını kontrol et - server-side API kullanarak
      const response = await fetch(`/api/get-latest-sacrifice-share?id=${sacrifice.sacrifice_id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kurbanlık bilgileri alınamadı: " + (errorData.error || response.statusText),
        });
        setIsLocalLoading(false);
        return;
      }
      
      const latestSacrifice = await response.json();

      if (latestSacrifice.empty_share < selectedShareCount) {
        toast({
          variant: "destructive",
          title: "Uyarı",
          description:
            "Maalesef biraz önce bu kurbanlık ile ilgili yeni bir işlem yapıldı. Lütfen yeniden hisse adedi seçiniz.",
        });
        setSelectedShareCount(1);
        setIsLocalLoading(false);
        return;
      }

      // Seçilen hisse sayısını ana bileşene ilet
      onSelect(selectedShareCount);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.",
      });
      setIsLocalLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-base sm:text-lg">Hisse Adedi Seçimi</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 sm:space-y-8">
          {currentEmptyShare === 0 ? (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 sm:p-4",
                "bg-destructive/15 text-destructive border-destructive/50"
              )}
            >
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <p className="text-xs sm:text-sm">
                Üzgünüz, şu anda bu kurbanlıkta boş hisse kalmadı.
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-muted-foreground text-xs sm:text-sm">
                Seçmiş olduğunuz{" "}
                <span className="text-sac-primary font-medium">
                  {sacrifice.share_price.toLocaleString("tr-TR")} ₺
                </span>
                &apos;lik kurbanlıktan kaç adet hisse almak istersiniz?
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-4 justify-center items-center max-w-[500px] mx-auto">
                {shareOptions.map((count) => (
                  <Button
                    key={count}
                    variant={selectedShareCount === count ? "default" : "outline"}
                    className="h-8 w-8 sm:h-12 sm:w-12 text-sm sm:text-lg"
                    onClick={() => setSelectedShareCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-muted-foreground flex-1">
                  Hissedar bilgilerini girmek için lütfen devam butonuna
                  basınız.
                </p>
                <Button 
                  onClick={handleContinue}
                  disabled={isButtonLoading}
                  className="h-8 sm:h-10 text-xs sm:text-sm whitespace-nowrap"
                >
                  {isButtonLoading ? "İşleminiz Yapılıyor..." : "Devam"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
