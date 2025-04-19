import {
    FormData as HelperFormData,
    handleApprove as helperHandleApprove,
    handleShareCountSelect as helperHandleShareCountSelect
} from "@/helpers/hisseal-helpers";
import { sacrificeSchema } from "@/types";
import React from "react";

// Common types
type FormDataType = {
    name: string;
    phone: string;
    delivery_location: string;
    is_purchaser?: boolean;
};

// Define a simplified router type with the methods we need
type RouterType = {
    push: (href: string, options?: { scroll?: boolean }) => void;
    replace: (href: string, options?: { scroll?: boolean }) => void;
    refresh: () => void;
    back: () => void;
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


type ShareholderResponse = {
    success: boolean;
    message: string;
    data?: {
        shareholders?: FormDataType[];
    };
};

// Define ShareholderFormData type to match the one used in form-view.tsx
interface ShareholderFormData {
    name: string;
    phone: string;
    delivery_location: string;
    delivery_fee: number;
    sacrifice_consent: boolean;
    is_purchaser?: boolean;
    shareCount?: number;
    delivery?: {
        location: string;
        useTeslimat: boolean;
        date: string;
        address: string;
        notes?: string;
    };
    shareholders?: Record<string, {
        name: string;
        phone: string;
        shareCount: number;
    }>;
}

// Define a proper ShareholderInput type for API submission
interface ShareholderInput {
    shareholder_name: string;
    phone_number: string;
    transaction_id: string;
    sacrifice_id: string;
    share_price: number;
    shares_count: number;
    delivery_location: string;
    delivery_fee?: number; // Optional
    delivery_date: string;
    delivery_address: string;
    delivery_notes: string;
    security_code: string;
    purchased_by: string;
    last_edited_by: string;
    is_purchaser?: boolean; // Optional
    sacrifice_consent?: boolean; // Optional
    total_amount: number;
    remaining_payment: number;
}

// Mutation types with proper interfaces
interface UpdateShareCountMutationWrapper {
    mutate: (data: {
        transaction_id: string;
        share_count: number;
        operation: 'add' | 'remove';
    }) => Promise<{
        success: boolean;
        message: string;
    }>;
    reset?: () => void;
}

interface CreateReservationMutationWrapper {
    mutate: (data: ReservationData) => Promise<ReservationResponse>;
    reset?: () => void;
    isPending?: boolean;
    isLoading?: boolean;
    isFetching?: boolean;
}

interface CreateShareholdersMutationWrapper {
    mutate: (data: ShareholderInput[]) => Promise<ShareholderResponse>;
    reset?: () => void;
    isPending?: boolean;
    isLoading?: boolean;
    isFetching?: boolean;
    mutateAsync?: (data: ShareholderInput[]) => Promise<ShareholderResponse>;
}

// Toast interface
interface ToastOptions {
    variant?: 'default' | 'destructive';
    title?: string;
    description?: string;
}

type ToastFunction = (options: ToastOptions) => void;

// Types for handler creators
type SacrificeSelectHandlerParams = {
    setCameFromTimeout: (value: boolean) => void;
    needsRerender: React.MutableRefObject<boolean>;
    setTempSelectedSacrifice: (sacrifice: sacrificeSchema) => void;
    setIsDialogOpen: (open: boolean) => void;
};

type ShareCountSelectHandlerParams = {
    tempSelectedSacrifice: sacrificeSchema | null;
    updateShareCount: UpdateShareCountMutationWrapper;
    setSelectedSacrifice: (sacrifice: sacrificeSchema) => void;
    setFormData: (data: HelperFormData[]) => void;
    goToStep: (step: string) => void;
    setIsDialogOpen: (open: boolean) => void;
    setLastInteractionTime: (time: number) => void;
    toast: ToastFunction;
    transaction_id: string;
    createReservation: CreateReservationMutationWrapper;
    setShowReservationInfo: (show: boolean) => void;
    router?: RouterType;
    sacrifice_id?: string;
};

type ApproveHandlerParams = {
    selectedSacrifice: sacrificeSchema | null;
    formData: ShareholderFormData[];
    createShareholders: CreateShareholdersMutationWrapper;
    setSuccess: (success: boolean) => void;
    goToStep: (step: string) => void;
    toast: ToastFunction;
    router?: RouterType;
    transaction_id?: string;
    nextStep?: () => void;
    setLoading?: (loading: boolean) => void;
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
        if (nextStep) {
            nextStep();
        }
    };
};

// Create handler for PDF download
export const createHandlePdfDownload = () => {
    return () => {
        // PDF indirme işlemi buraya eklenecek
        console.log("PDF indirme işlemi");
    };
}; 