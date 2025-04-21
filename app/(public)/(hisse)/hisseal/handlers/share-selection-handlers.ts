import { Step } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import {
    CreateShareholdersMutation,
    FormDataType,
    GenericReservationMutation,
    sacrificeSchema,
    UpdateShareCountMutation
} from "@/types";

// Define types for API mutations
// Note: We're now importing these from @/types instead of defining them here

// Types for handler creators
type SacrificeSelectHandlerParams = {
    setCameFromTimeout: (value: boolean) => void;
    needsRerender: React.MutableRefObject<boolean>;
    setTempSelectedSacrifice: (sacrifice: sacrificeSchema) => void;
    setIsDialogOpen: (open: boolean) => void;
};

type ShareCountSelectHandlerParams = {
    tempSelectedSacrifice: sacrificeSchema | null;
    updateShareCount: UpdateShareCountMutation;
    setSelectedSacrifice: (sacrifice: sacrificeSchema) => void;
    setFormData: (data: FormDataType[]) => void;
    goToStep: (step: Step) => void;
    setIsDialogOpen: (open: boolean) => void;
    setLastInteractionTime: (time: number) => void;
    toast: {
        (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void
    };
    transaction_id: string;
    createReservation: GenericReservationMutation;
    setShowReservationInfo: (show: boolean) => void;
    router?: { push: (path: string) => void };
    sacrifice_id?: string;
};

type ApproveHandlerParams = {
    selectedSacrifice: sacrificeSchema | null;
    formData: FormDataType[];
    createShareholders: CreateShareholdersMutation;
    setSuccess: (success: boolean) => void;
    goToStep: (step: Step) => void;
    toast: {
        (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void
    };
    router?: { push: (path: string) => void };
    transaction_id?: string;
    nextStep?: () => void;
};

// Create handler for sacrifice selection
export const createHandleSacrificeSelect = ({
    setCameFromTimeout,
    needsRerender,
    setTempSelectedSacrifice,
    setIsDialogOpen
}: SacrificeSelectHandlerParams) => {
    return async (sacrifice: sacrificeSchema) => {
        // When the user interacts with a sacrifice, we're definitely no longer in post-timeout state
        setCameFromTimeout(false);
        needsRerender.current = false;

        setTempSelectedSacrifice(sacrifice);
        setIsDialogOpen(true);
    };
};

// Create handler for share count selection
export const createHandleShareCountSelect = ({
    tempSelectedSacrifice,
    setSelectedSacrifice,
    setFormData,
    goToStep,
    setIsDialogOpen,
    setLastInteractionTime,
    toast,
    transaction_id,
    createReservation,
    setShowReservationInfo,
    router: _router,
    sacrifice_id: _sacrifice_id
}: ShareCountSelectHandlerParams) => {
    return async (shareCount: number) => {
        try {
            // First, check the current number of shareholders for this sacrifice
            if (tempSelectedSacrifice) {
                try {
                    const response = await fetch(`/api/get-shareholder-count-by-sacrifice-id?sacrifice_id=${tempSelectedSacrifice.sacrifice_id}`);

                    if (response.ok) {
                        const data = await response.json();
                        const currentShareholderCount = data.count || 0;

                        // Maximum allowed shareholders per sacrifice is 7
                        const MAX_SHAREHOLDERS = 7;

                        // Calculate how many more shareholders can be added
                        const availableShareCount = MAX_SHAREHOLDERS - currentShareholderCount;

                        // Check if the user is trying to select more shares than available
                        if (shareCount > availableShareCount) {
                            toast({
                                variant: "destructive",
                                title: "Hisse Sınırı Aşıldı",
                                description: `Bu hayvan için şu anda en fazla ${availableShareCount} adet hisse alabilirsiniz.`,
                            });

                            // Don't close the dialog, return early
                            // We'll notify the ShareSelectDialog to re-enable its button
                            return;
                        }
                    }
                } catch {
                }
            }

            // If the validation passes, proceed with the normal flow
            // Use mutateAsync instead of helperHandleShareCountSelect to correctly handle the Promise
            if (!tempSelectedSacrifice) {
                throw new Error("No sacrifice selected");
            }

            // Create the reservation using mutateAsync (returns a Promise)
            const reservationResult = await createReservation.mutateAsync({
                transaction_id,
                sacrifice_id: tempSelectedSacrifice.sacrifice_id,
                share_count: shareCount
            });

            if (!reservationResult.success) {
                throw new Error(reservationResult.message || "Failed to create reservation");
            }

            // Update local state with the selected sacrifice
            setSelectedSacrifice(tempSelectedSacrifice);

            // Set form data with empty placeholders for each shareholder
            const newFormData = Array.from({ length: shareCount }, () => ({
                name: "",
                phone: "",
                delivery_location: "Kesimhane",
                is_purchaser: false
            }));

            // Mark the first shareholder as the purchaser by default
            if (newFormData.length > 0) {
                newFormData[0].is_purchaser = true;
            }

            setFormData(newFormData);

            // Update interaction time to reset the timeout
            setLastInteractionTime(Date.now());

            // Önce dialog'u kapat
            setIsDialogOpen(false);

            // Sayfa başına yumuşak bir şekilde kaydır
            window.scrollTo({ top: 0, behavior: "smooth" });

            // Kısa bir gecikme sonra details adımına geç (kaydırma animasyonu için zaman tanır)
            setTimeout(() => {
                // Direkt olarak details adımına geç
                goToStep("details");

                // Details adımına geçtikten SONRA bilgi diyaloğunu göster
                setTimeout(() => {
                    setShowReservationInfo(true);
                }, 300);
            }, 500);
        } catch {
            toast({
                variant: "destructive",
                title: "Hata",
                description:
                    "İşlem sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
            });
        }
    };
};

// Create handler for reservation info dialog close
export const createHandleReservationInfoClose = (
    setShowReservationInfo: (show: boolean) => void
) => {
    return () => {
        setShowReservationInfo(false);
        // Artık ilerleme gerekmiyor çünkü zaten details adımındayız
    };
};

// Create handler for approval
export const createHandleApprove = ({
    createShareholders: _createShareholders, // Kullanılmayacak
    setSuccess,
    goToStep,
    toast,
    transaction_id: _transaction_id,
    nextStep
}: ApproveHandlerParams) => {
    return async () => {
        try {
            // Sadece UI güncelleme işlemlerini yapalım
            // Veritabanı işlemlerini YAPMA, çünkü bunlar shareholder-summary.tsx içindeki 
            // handleTermsConfirm fonksiyonunda zaten yapılıyor

            // Başarı durumunu güncelle
            setSuccess(true);

            // Success adımına geç
            goToStep("success");

            // Call nextStep if it exists
            if (nextStep) {
                nextStep();
            }

            // Başarı mesajı göster
            toast({
                title: "İşlem Başarılı",
                description: "Hissedar kayıtları başarıyla oluşturuldu.",
            });
        } catch {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Görünüm güncellenirken beklenmeyen bir hata oluştu.",
            });
        }
    };
};

// Create handler for PDF download
export const createHandlePdfDownload = () => {
    return () => {
        // PDF indirme işlemi buraya eklenecek
    };
}; 