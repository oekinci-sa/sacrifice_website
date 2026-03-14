import { sacrificeSchema } from "@/types";

// handleShareCountSelect - legacy, share-selection-handlers.ts kullanıyor
export const handleShareCountSelect = async ({
  shareCount,
  tempSelectedSacrifice,
  updateShareCount,
  setSelectedSacrifice,
  setFormData,
  goToStep,
  setIsDialogOpen,
  setLastInteractionTime,
  toast,
  transaction_id,
  createReservation
}: {
  shareCount: number;
  tempSelectedSacrifice: sacrificeSchema | null;
  updateShareCount: (args: unknown) => void;
  setSelectedSacrifice: (sacrifice: sacrificeSchema) => void;
  setFormData: (data: unknown[]) => void;
  goToStep: (step: string) => void;
  setIsDialogOpen: (open: boolean) => void;
  setLastInteractionTime: (time: number) => void;
  toast: (opts: { variant?: string; title?: string; description?: string }) => void;
  transaction_id: string;
  createReservation: { mutateAsync: (args: unknown) => Promise<unknown> };
}) => {
  try {
    if (!tempSelectedSacrifice) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kurbanlık seçimi yapılmadı.",
      });
      return;
    }

    if (!transaction_id || transaction_id.length !== 16) {
      toast({
        variant: "destructive",
        title: "Sistem Hatası",
        description: "Geçersiz işlem kimliği. Lütfen sayfayı yenileyip tekrar deneyin.",
      });
      return;
    }

    const result = await createReservation.mutateAsync({
      transaction_id,
      sacrifice_id: tempSelectedSacrifice.sacrifice_id,
      share_count: shareCount,
    });

    setSelectedSacrifice(tempSelectedSacrifice);

    setFormData(
      Array(shareCount).fill({
        name: "",
        phone: "",
        delivery_location: "",
        is_purchaser: false
      })
    );

    setIsDialogOpen(false);
    setLastInteractionTime(Date.now());
  } catch (err) {
    let errorMessage = "İşlem sırasında bir hata oluştu.";

    if (err instanceof Error) {
      errorMessage = err.message;
      if (errorMessage.includes('transaction_id') && errorMessage.includes('length')) {
        errorMessage = "Sistem hatası: İşlem kodu uyumsuz. Lütfen sayfayı yenileyip tekrar deneyin.";
      }
    }

    toast({
      variant: "destructive",
      title: "Hata",
      description: errorMessage,
    });

    setIsDialogOpen(false);
  }
};

/**
 * Form verileriyle hissedarları oluşturur ve başarı durumuna geçer
 * Legacy - shareholder-summary.tsx kendi implementasyonunu kullanıyor
 */
export const handleApprove = async ({
  selectedSacrifice,
  formData,
  createShareholders,
  setSuccess,
  goToStep,
  toast,
}: {
  selectedSacrifice: sacrificeSchema | null;
  formData: unknown[];
  createShareholders: (args: unknown) => void;
  setSuccess: (success: boolean) => void;
  goToStep: (step: string) => void;
  toast: (opts: { variant?: string; title?: string; description?: string }) => void;
}) => {
  setSuccess(true);
  goToStep("success");
};
