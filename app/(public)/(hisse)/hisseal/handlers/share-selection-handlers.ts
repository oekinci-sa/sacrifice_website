import {
    handleApprove as helperHandleApprove,
    handleShareCountSelect as helperHandleShareCountSelect
} from "@/helpers/hisseal-helpers";
import { sacrificeSchema } from "@/types";

// Types for handler creators
type SacrificeSelectHandlerParams = {
    setCameFromTimeout: (value: boolean) => void;
    needsRerender: React.MutableRefObject<boolean>;
    setTempSelectedSacrifice: (sacrifice: sacrificeSchema) => void;
    setIsDialogOpen: (open: boolean) => void;
};

type ShareCountSelectHandlerParams = {
    tempSelectedSacrifice: sacrificeSchema | null;
    updateShareCount: any;
    setSelectedSacrifice: (sacrifice: sacrificeSchema) => void;
    setFormData: any;
    goToStep: (step: any) => void;
    setIsDialogOpen: (open: boolean) => void;
    setLastInteractionTime: (time: number) => void;
    toast: any;
    transaction_id: string;
    createReservation: any;
    setShowReservationInfo: (show: boolean) => void;
};

type ApproveHandlerParams = {
    selectedSacrifice: sacrificeSchema | null;
    formData: any;
    createShareholders: any;
    setSuccess: (success: boolean) => void;
    goToStep: (step: any) => void;
    toast: any;
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
    updateShareCount,
    setSelectedSacrifice,
    setFormData,
    goToStep,
    setIsDialogOpen,
    setLastInteractionTime,
    toast,
    transaction_id,
    createReservation,
    setShowReservationInfo
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
                            console.log(`Too many shares selected: ${shareCount}, available: ${availableShareCount}`);
                            toast({
                                variant: "destructive",
                                title: "Hisse Sınırı Aşıldı",
                                description: `Bu hayvan için şu anda en fazla ${availableShareCount} adet hisse alabilirsiniz.`,
                            });

                            // Don't close the dialog, return early
                            // We'll notify the ShareSelectDialog to re-enable its button
                            if (createReservation && typeof createReservation.reset === 'function') {
                                // Reset any loading state in the API mutation
                                createReservation.reset();
                            }

                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error checking shareholder count:', error);
                    // Continue with the process even if we couldn't check the count
                }
            }

            // If the validation passes, proceed with the normal flow
            await helperHandleShareCountSelect({
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
                createReservation,
            });

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
        } catch (error) {
            console.error("Error in handleShareCountSelect:", error);
            toast({
                variant: "destructive",
                title: "Hata",
                description:
                    "İşlem sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
            });

            // Make sure to reset any loading state if there's an error
            if (createReservation && typeof createReservation.reset === 'function') {
                createReservation.reset();
            }
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
    selectedSacrifice,
    formData,
    createShareholders,
    setSuccess,
    goToStep,
    toast
}: ApproveHandlerParams) => {
    return async () => {
        await helperHandleApprove({
            selectedSacrifice,
            formData,
            createShareholders,
            setSuccess,
            goToStep,
            toast,
        });
    };
};

// Create handler for PDF download
export const createHandlePdfDownload = () => {
    return () => {
        // PDF indirme işlemi buraya eklenecek
        console.log("PDF indirme işlemi");
    };
}; 