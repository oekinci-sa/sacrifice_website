"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { sacrificeSchema } from "@/types";
import { supabase } from "@/utils/supabaseClient";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

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

  // Get sacrifice data from the data store
  const { sacrifices, refetchSacrifices } = useSacrificeStore();

  // UI state remains in the component (not moved to store)
  const [selectedShareCount, setSelectedShareCount] = useState(1);
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  // Get transaction ID management
  const generateNewTransactionId = useReservationIDStore(state => state.generateNewTransactionId);

  // Get the most up-to-date sacrifice information from the store
  const currentSacrifice = sacrifices.find(s => s.sacrifice_id === sacrifice.sacrifice_id) || sacrifice;
  const currentEmptyShare = currentSacrifice.empty_share;

  const isButtonLoading = isLoading || isLocalLoading;

  // Reset state and fetch fresh data when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log("Share select dialog opened - Fetching fresh data");

      // First fetch when dialog opens
      refetchSacrifices();

      // Schedule a second fetch after a short delay to ensure we have the latest data
      const timer = setTimeout(() => {
        console.log("Secondary data refresh in ShareSelectDialog");
        refetchSacrifices();
      }, 300);

      // Reset the selected share count to 1 (or max available if less than 1)
      setSelectedShareCount(1);
      setIsLocalLoading(false);

      // Generate a new transaction ID when the dialog opens
      generateNewTransactionId();
      console.log('Generated new transaction ID when dialog opened:',
        useReservationIDStore.getState().transaction_id);

      return () => clearTimeout(timer);
    }
  }, [isOpen, generateNewTransactionId, refetchSacrifices]);

  // Monitor createReservation status to reset loading state if the handler reset it
  useEffect(() => {
    if (!isLoading && isLocalLoading) {
      // Reset local loading state if parent loading state is reset
      // This happens when the handler detects a share limit error
      setIsLocalLoading(false);
    }
  }, [isLoading, isLocalLoading]);

  useEffect(() => {
    // Reset selected count when dialog is closed
    if (!isOpen) {
      setSelectedShareCount(1);
      setIsLocalLoading(false); // Also reset loading state when dialog is closed
    }

    // Adjust selected count if it's more than available shares
    if (selectedShareCount > currentEmptyShare) {
      setSelectedShareCount(Math.max(1, currentEmptyShare));
    }

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
            // Real-time updates will be handled by the Zustand store,
            // but we'll adjust the selected count if needed
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
  }, [sacrifice.sacrifice_id, currentEmptyShare, isOpen, selectedShareCount]);

  const shareOptions = Array.from(
    { length: Math.max(0, currentEmptyShare) },
    (_, i) => i + 1
  );

  const handleContinue = async () => {
    setIsLocalLoading(true);

    // Safety timeout to ensure button doesn't get stuck in loading state
    const safetyTimer = setTimeout(() => {
      setIsLocalLoading(false);
    }, 5000); // Reset after 5 seconds if still loading

    try {
      // Fetch the latest sacrifice data directly from the server
      const response = await fetch(`/api/get-latest-sacrifice-share?id=${sacrifice.sacrifice_id}`);

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kurbanlık bilgileri alınamadı: " + (errorData.error || response.statusText),
        });
        setIsLocalLoading(false);
        clearTimeout(safetyTimer);
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
        // Update the Zustand store with the latest data
        refetchSacrifices();
        setIsLocalLoading(false);
        clearTimeout(safetyTimer);
        return;
      }

      // Seçilen hisse sayısını ana bileşene ilet
      onSelect(selectedShareCount);
      clearTimeout(safetyTimer); // Clear the safety timer
    } catch (err) {
      console.error("Error in handleContinue:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.",
      });
      setIsLocalLoading(false);
      clearTimeout(safetyTimer);
    }
  };

  // Add a retry mechanism for button clicks
  const handleButtonClick = (count: number) => {
    console.log(`Button ${count} clicked`);
    // Force a state update to ensure the button click is registered
    setTimeout(() => {
      setSelectedShareCount(count);
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="md:max-w-xl md:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-base md:text-xl font-bold">Hisse Adedi Seçimi</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 md:space-y-8">
          {currentEmptyShare === 0 ? (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 md:p-4",
                "bg-destructive/15 text-destructive border-destructive/50"
              )}
            >
              <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <p className="text-xs md:text-sm">
                Üzgünüz, şu anda bu kurbanlıkta boş hisse kalmadı.
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-muted-foreground font-medium text-xs md:text-lg">
                Seçmiş olduğunuz{" "}
                <span className="text-sac-primary font-bold">
                  {currentSacrifice.share_price.toLocaleString("tr-TR")} TL
                </span>
                &apos;lik kurbanlıktan<br />kaç adet hisse almak istersiniz?
              </p>
              <div className="flex flex-wrap gap-2 md:gap-4 justify-center items-center max-w-[500px] mx-auto">
                {shareOptions.map((count) => (
                  <Button
                    key={count}
                    variant={selectedShareCount === count ? "default" : "outline"}
                    className="h-8 w-8 md:h-12 md:w-12 text-sm md:text-lg"
                    onClick={() => handleButtonClick(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleContinue}
                disabled={isButtonLoading}
                className="h-8 md:h-10 text-xs md:text-base whitespace-nowrap mx-auto block"
              >
                {isButtonLoading ? "İşleminiz Yapılıyor..." : "Devam"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
