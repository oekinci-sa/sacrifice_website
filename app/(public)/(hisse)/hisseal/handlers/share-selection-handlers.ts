import {
    handleApprove as helperHandleApprove,
    handleShareCountSelect as helperHandleShareCountSelect
} from "@/helpers/hisseal-helpers";
import { sacrificeSchema } from "@/types";
import { MutationFunction } from "@tanstack/react-query";

// Define types for the form data
type FormDataType = {
    name: string;
    phone: string;
    delivery_location: string;
    is_purchaser?: boolean;
};

// Define types for API mutations
type UpdateShareCountMutation = {
    mutate: MutationFunction<
        { success: boolean; message: string },
        { transaction_id: string; share_count: number; operation: 'add' | 'remove' }
    >;
    reset?: () => void;
};

type ReservationData = {
    transaction_id: string;
    sacrifice_id: string;
    share_count: number;
};

type ReservationResponse = {
    success: boolean;
    message: string;
    reservation_id?: string;
};

type CreateReservationMutation = {
    mutate: MutationFunction<ReservationResponse, ReservationData>;
    reset?: () => void;
};

type ShareholderData = {
    transaction_id: string;
    sacrifice_id: string;
    shareholders: FormDataType[];
};

type ShareholderResponse = {
    success: boolean;
    message: string;
    data?: {
        shareholders?: FormDataType[];
    };
};

type CreateShareholdersMutation = {
    mutate: MutationFunction<ShareholderResponse, ShareholderData>;
};

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
    goToStep: (step: string) => void;
    setIsDialogOpen: (open: boolean) => void;
    setLastInteractionTime: (time: number) => void;
    toast: {
        (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void
    };
    transaction_id: string;
    createReservation: CreateReservationMutation;
    setShowReservationInfo: (show: boolean) => void;
    router: { push: (path: string) => void };
    sacrifice_id?: string;
};

type ApproveHandlerParams = {
    selectedSacrifice: sacrificeSchema | null;
    formData: FormDataType[];
    createShareholders: CreateShareholdersMutation;
    setSuccess: (success: boolean) => void;
    goToStep: (step: string) => void;
    toast: {
        (options: { variant?: 'default' | 'destructive'; title?: string; description?: string }): void
    };
    router: { push: (path: string) => void };
    transaction_id?: string;
    nextStep: () => void;
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
    toast,
    router: _router,
    transaction_id: _transaction_id,
    nextStep
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
        nextStep();
    };
};

// Create handler for PDF download
export const createHandlePdfDownload = () => {
    return () => {
        // PDF indirme işlemi buraya eklenecek
        console.log("PDF indirme işlemi");
    };
}; 