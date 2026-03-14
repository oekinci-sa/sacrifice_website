import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { sacrificeSchema } from "@/types";
import { useEffect } from "react";
import { CANCEL_RESERVATION_API } from "./types";

// Sayfa kapatma/yenileme durumunda DB güncelleme
export const setupPageUnloadHandlers = ({
  currentStep,
  selectedSacrifice,
  formData,
  transaction_id,
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: unknown[];
  transaction_id: string;
}) => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    // Sadece 2. ve 3. adımda çalışsın
    if (currentStep !== "details" && currentStep !== "confirmation") return;
    if (!selectedSacrifice || !formData.length) return;
    if (!transaction_id) return;

    // Tarayıcının standart onay mesajını göster
    e.preventDefault();
    e.returnValue = "";
  };

  const handleUnload = () => {
    // Sadece 2. ve 3. adımda çalışsın
    if (currentStep !== "details" && currentStep !== "confirmation") return;
    if (!selectedSacrifice || !formData.length) return;
    if (!transaction_id) return;

    // Beacon API ile rezervasyon iptal işlemini yap
    const cancelData = {
      transaction_id: transaction_id
    };

    const blob = new Blob([JSON.stringify(cancelData)], {
      type: "application/json",
    });

    navigator.sendBeacon(CANCEL_RESERVATION_API, blob);
  };

  return { handleBeforeUnload, handleUnload };
};

/**
 * Hook to handle page unload
 * Sayfa yenilenirken veya kapatılırken gerekli temizleme işlemlerini yapar
 */
export const useHandlePageUnload = ({
  currentStep,
  selectedSacrifice,
  formData,
  isSuccess,
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: unknown[];
  isSuccess: boolean;
}) => {
  const { transaction_id } = useReservationIDStore();

  useEffect(() => {
    if (isSuccess) return;

    const { handleBeforeUnload, handleUnload } = setupPageUnloadHandlers({
      currentStep,
      selectedSacrifice,
      formData,
      transaction_id,
    });

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [currentStep, selectedSacrifice, formData, transaction_id, isSuccess]);
};
