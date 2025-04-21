import {
    useCreateReservation,
    useReservationStatus,
    useUpdateShareCount
} from "@/hooks/useReservations";
import { useCreateShareholders } from "@/hooks/useShareholders";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { useShareSelectionFlowStore } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import { useEffect } from "react";

export function usePageInitialization() {
    // Zustand data store for sacrifices
    const {
        sacrifices,
        isLoadingSacrifices,
        isRefetching,
        refetchSacrifices
    } = useSacrificeStore();

    // Zustand UI flow store
    const {
        selectedSacrifice,
        tempSelectedSacrifice,
        formData,
        currentStep,
        tabValue,
        isSuccess,
        hasNavigatedAway,
        setSelectedSacrifice,
        setTempSelectedSacrifice,
        setFormData,
        goToStep,
        resetStore,
        setSuccess,
        setHasNavigatedAway
    } = useShareSelectionFlowStore();

    useEffect(() => {
        const fetchData = async () => {
            try {
                await refetchSacrifices();
            } catch (error) {
            }
        };

        fetchData();
    }, [refetchSacrifices]);

    // Reservation store - transaction_id yönetimi
    const { transaction_id, generateNewTransactionId } = useReservationIDStore();

    // React Query hooks
    const updateShareCount = useUpdateShareCount();
    const createShareholders = useCreateShareholders();
    const createReservation = useCreateReservation();

    // Reservation status hook (only active in details and confirmation steps)
    const shouldCheckStatus =
        currentStep === "details" || currentStep === "confirmation";
    const {
        data: reservationStatus,
        isLoading: isStatusLoading,
    } = useReservationStatus(shouldCheckStatus ? transaction_id : "");

    // Combined loading state - Yükleniyor göstergesini ilk yüklenme sırasında göstermeyelim
    // Sadece kullanıcı işlem yaparken (hisse seçimi, rezervasyon vb.) gösterelim
    const isLoading =
        (currentStep !== "selection" && isLoadingSacrifices) ||
        isStatusLoading ||
        (currentStep !== "selection" && isRefetching);

    return {
        // Zustand stores
        sacrifices,
        isLoadingSacrifices,
        isRefetching,
        refetchSacrifices,
        selectedSacrifice,
        tempSelectedSacrifice,
        formData,
        currentStep,
        tabValue,
        isSuccess,
        hasNavigatedAway,
        setSelectedSacrifice,
        setTempSelectedSacrifice,
        setFormData,
        goToStep,
        resetStore,
        setSuccess,
        setHasNavigatedAway,
        transaction_id,
        generateNewTransactionId,

        // React Query hooks
        updateShareCount,
        createShareholders,
        createReservation,
        reservationStatus,
        isStatusLoading,

        // Computed values
        shouldCheckStatus,
        isLoading
    };
} 