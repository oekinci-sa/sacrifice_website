import {
    useCreateReservation,
    useReservationStatus,
    useUpdateShareCount
} from "@/hooks/useReservations";
import { useCreateShareholders } from "@/hooks/useShareholders";
import { SACRIFICE_UPDATED_EVENT, useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { useShareSelectionFlowStore } from "@/stores/only-public-pages/useShareSelectionFlowStore";
import { setupRefreshListener } from "@/utils/data-refresh";
import { useEffect } from "react";

export function usePageInitialization() {
    // Zustand data store for sacrifices
    const {
        sacrifices,
        isLoadingSacrifices,
        isRefetching,
        refetchSacrifices,
        subscribeToRealtime,
        unsubscribeFromRealtime
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
                console.log("usePageInitialization: İlk veri yüklemesi başlatılıyor...");
                const data = await refetchSacrifices();
                console.log("usePageInitialization: İlk veri yüklemesi tamamlandı, veri sayısı:", data.length);

                // Realtime subscription'ı aktifleştir
                subscribeToRealtime();
                console.log("usePageInitialization: Realtime aboneliği aktifleştirildi");
            } catch (error) {
                console.error("usePageInitialization: Veri yükleme hatası:", error);
                // Hata durumunda da bir sonraki denemede çalışabilmesi için
                setTimeout(() => {
                    refetchSacrifices().catch(e =>
                        console.error("usePageInitialization: Yeniden veri yükleme hatası:", e)
                    );
                }, 3000);
            }
        };

        fetchData();

        // Set up listener for sacrifice data updates triggered by admin operations
        const cleanupRefreshListener = setupRefreshListener(SACRIFICE_UPDATED_EVENT, () => {
            console.log("usePageInitialization: SACRIFICE_UPDATED_EVENT alındı, veriler yenileniyor...");
            // Burada doğrudan store'u güncelliyoruz
            refetchSacrifices().then(data => {
                console.log("usePageInitialization: Veriler güncellendi, veri sayısı:", data.length);
            }).catch(error => {
                console.error("usePageInitialization: Veri güncelleme hatası:", error);
            });
        });

        // Cleanup on unmount
        return () => {
            unsubscribeFromRealtime();
            cleanupRefreshListener();
        };
    }, [refetchSacrifices, subscribeToRealtime, unsubscribeFromRealtime]);

    // Reservation store - transaction_id management
    const { transaction_id, generateNewTransactionId } = useReservationIDStore();

    // Custom hooks for operations (now using Zustand instead of React Query)
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

    // Combined loading state - don't show loading indicator during initial load
    // Only show when user is performing actions (share selection, reservation, etc.)
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
        subscribeToRealtime,
        unsubscribeFromRealtime,
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

        // Operation hooks
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