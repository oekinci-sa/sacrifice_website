import { supabase } from "@/utils/supabaseClient";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useUpdateSacrifice } from "@/hooks/useSacrifices";
import { useCreateReservation, useCancelReservation, useTimeoutReservation } from "@/hooks/useReservations";
import { sacrificeSchema, Step } from "@/types";
import { useReservationStore } from "@/stores/useReservationStore";

// Define a more generic type for form data that matches what's used in the page component
export interface FormData {
  name: string;
  phone: string;
  delivery_location: string;
}

// API route for resetting shares
const RESET_SHARES_API = "/api/reset-shares";

// API route for reservation cancellation - for sendBeacon API
const CANCEL_RESERVATION_API = "/api/cancel-reservation";

// Sayfa kapatma/yenileme durumunda DB güncelleme
export const setupPageUnloadHandlers = ({
  currentStep,
  selectedSacrifice,
  formData,
  transaction_id, // transaction_id'yi de parametre olarak alalım
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: any[];
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
    // Sadece transaction_id gönderiliyor
    const cancelData = {
      transaction_id: transaction_id
    };

    const blob = new Blob([JSON.stringify(cancelData)], {
      type: "application/json",
    });
    
    // sendBeacon API kullan - sayfa kapanırken bile çalışır
    navigator.sendBeacon(CANCEL_RESERVATION_API, blob);
    
    // Debug amaçlı loglama (sayfa kapanıyor olsa da konsolda loglar)
    console.log("Sayfa kapatma/ayrılma işlemi: Rezervasyon iptal ediliyor", cancelData);
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
  formData
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: any[];
}) => {
  // Reservation store'dan transaction_id'yi alalım
  const transaction_id = useReservationStore(state => state.transaction_id);

  useEffect(() => {
    // Sadece gerektiğinde event dinleyicileri ekle
    if (selectedSacrifice && formData.length && transaction_id) {
      // Handler'ları ayarla - transaction_id'yi de geçir
      const { handleBeforeUnload, handleUnload } = setupPageUnloadHandlers({
        currentStep,
        selectedSacrifice,
        formData,
        transaction_id
      });

      // Event dinleyicilerini ekle
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("unload", handleUnload);

      // Temizleme
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("unload", handleUnload);
      };
    }
  }, [currentStep, selectedSacrifice, formData, transaction_id]);
};

type NavigationHandlerParams = {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: any[];
  updateSacrifice: any;
  resetStore: () => void;
  goToStep: (step: string) => void;
  isSuccess: boolean;
  toast: any;
};

// Sayfa navigasyon değişikliklerini işleme
export const setupNavigationHandler = ({
  currentStep,
  selectedSacrifice,
  formData,
  updateSacrifice,
  resetStore,
  goToStep,
  isSuccess,
  toast,
}: NavigationHandlerParams) => {
  let isNavigating = false;

  const handleRouteChange = async (): Promise<boolean> => {
    if (isNavigating) return true;
    if (isSuccess) return true;

    if (currentStep !== "details" && currentStep !== "confirmation")
      return true;
    if (!selectedSacrifice || !formData.length) return true;

    isNavigating = true;

    try {
      const { data: currentSacrifice, error: fetchError } = await supabase
        .from("sacrifice_animals")
        .select("empty_share")
        .eq("sacrifice_id", selectedSacrifice.sacrifice_id)
        .single();

      if (fetchError || !currentSacrifice) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kurbanlık bilgileri alınamadı.",
        });
        return false;
      }

      await updateSacrifice.mutateAsync({
        sacrificeId: selectedSacrifice.sacrifice_id,
        emptyShare: currentSacrifice.empty_share + formData.length,
      });

      resetStore();
      goToStep("selection");
      return true;
    } catch (err) {
      console.error('Error handling route change:', err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
      });
      return false;
    } finally {
      isNavigating = false;
    }
  };

  return { handleRouteChange };
};

/**
 * Hook to handle navigation changes
 * Updates the empty share count when the user navigates away from the page
 */
export const useHandleNavigation = (
  currentStep: Step,
  selectedSacrifice: sacrificeSchema | null,
  formData: FormData[],
  isSuccess: boolean,
  resetStore: () => void,
  goToStep: (step: string) => void
) => {
  const { toast } = useToast();
  const updateSacrifice = useUpdateSacrifice();

  useEffect(() => {
    let isNavigating = false;

    const handleRouteChange = async (): Promise<boolean> => {
      if (isNavigating) return true;
      if (isSuccess) return true;

      if (currentStep !== "details" && currentStep !== "confirmation")
        return true;
      if (!selectedSacrifice || !formData.length) return true;

      isNavigating = true;

      try {
        const { data: currentSacrifice, error: fetchError } = await supabase
          .from("sacrifice_animals")
          .select("empty_share")
          .eq("sacrifice_id", selectedSacrifice.sacrifice_id)
          .single();

        if (fetchError || !currentSacrifice) {
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Kurbanlık bilgileri alınamadı.",
          });
          return false;
        }

        await updateSacrifice.mutateAsync({
          sacrificeId: selectedSacrifice.sacrifice_id,
          emptyShare: currentSacrifice.empty_share + formData.length,
        });

        resetStore();
        goToStep("selection");
        return true;
      } catch (err) {
        console.error('Error handling route change:', err);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "İşlem sırasında bir hata oluştu.",
        });
        return false;
      } finally {
        isNavigating = false;
      }
    };

    const handlePopState = async (event: PopStateEvent) => {
      const result = await handleRouteChange();
      if (!result) {
        event.preventDefault();
        history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    function createHistoryStateHandler(originalFn: (data: unknown, unused: string, url?: string | URL | null) => void) {
      return function(this: History, data: unknown, unused: string, url?: string | URL | null) {
        if (url) {
          handleRouteChange().then((shouldContinue) => {
            if (shouldContinue) {
              originalFn.apply(this, [data, unused, url] as [unknown, string, string | URL | null]);
            }
          });
        }
      };
    }

    window.history.pushState = createHistoryStateHandler(originalPushState);
    window.history.replaceState = createHistoryStateHandler(originalReplaceState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [
    currentStep,
    selectedSacrifice,
    formData,
    updateSacrifice,
    resetStore,
    goToStep,
    isSuccess,
    toast,
  ]);
};

// Handle interaction timeout
export const useHandleInteractionTimeout = (
  isSuccess: boolean,
  currentStep: string,
  selectedSacrifice: sacrificeSchema | null,
  formData: any[],
  updateShareCount: any,
  goToStep: (step: string) => void,
  resetStore: () => void,
  lastInteractionTime: number,
  showWarning: boolean,
  setShowWarning: (show: boolean) => void,
  setTimeLeft: (time: number) => void,
  TIMEOUT_DURATION: number,
  WARNING_THRESHOLD: number
) => {
  const { toast } = useToast();
  const transaction_id = useReservationStore(state => state.transaction_id);
  const timeoutReservation = useTimeoutReservation();

  useEffect(() => {
    if (isSuccess) return;

    const checkTimeout = async () => {
      if (currentStep !== "details" && currentStep !== "confirmation") return;

      const timePassed = Math.floor((Date.now() - lastInteractionTime) / 1000);
      const remaining = TIMEOUT_DURATION - timePassed;

      if (remaining <= 0) {
        try {
          if (selectedSacrifice) {
            await timeoutReservation.mutateAsync({
              transaction_id
            });
          }
        } catch (err) {
          console.error('Error handling timeout:', err);
        } finally {
          setShowWarning(false);
          goToStep("selection");
          resetStore();
          setTimeLeft(TIMEOUT_DURATION);
          
          toast({
            variant: "destructive",
            title: "Zaman Aşımı",
            description: "Oturumunuz zaman aşımına uğradı. Lütfen işleminize yeniden başlayın.",
          });
        }
      } else {
        setTimeLeft(remaining);

        if (remaining <= WARNING_THRESHOLD && !showWarning) {
          setShowWarning(true);
          toast({
            title: "Uyarı",
            description: "Oturumunuz 1 dakika içinde sonlanacak.",
          });
        }
      }
    };

    const timer = setInterval(checkTimeout, 1000);
    return () => clearInterval(timer);
  }, [
    lastInteractionTime,
    showWarning,
    currentStep,
    selectedSacrifice,
    formData.length,
    updateShareCount,
    goToStep,
    resetStore,
    isSuccess,
    toast,
    TIMEOUT_DURATION,
    WARNING_THRESHOLD,
    setShowWarning,
    setTimeLeft,
    transaction_id,
    timeoutReservation
  ]);
};

// Sayfa seviyesinde etkileşimleri takip et
export const useTrackInteractions = (
  currentStep: string,
  setLastInteractionTime: (time: number) => void,
  setShowWarning: (show: boolean) => void,
  setTimeLeft: (time: number) => void,
  TIMEOUT_DURATION: number
) => {
  useEffect(() => {
    const handleInteraction = () => {
      if (currentStep === "details" || currentStep === "confirmation") {
        setLastInteractionTime(Date.now());
        setShowWarning(false);
        setTimeLeft(TIMEOUT_DURATION); // Her etkileşimde süreyi sıfırla
      }
    };

    // Mouse tıklamaları
    const handleMouseInteraction = () => handleInteraction();

    // Klavye etkileşimleri
    const handleKeyInteraction = () => handleInteraction();

    // Scroll etkileşimleri
    const handleScrollInteraction = () => handleInteraction();

    // Focus değişiklikleri
    const handleFocusInteraction = () => handleInteraction();

    if (currentStep === "details" || currentStep === "confirmation") {
      window.addEventListener("mousedown", handleMouseInteraction);
      window.addEventListener("keydown", handleKeyInteraction);
      window.addEventListener("scroll", handleScrollInteraction);
      window.addEventListener("focus", handleFocusInteraction);
    }

    return () => {
      window.removeEventListener("mousedown", handleMouseInteraction);
      window.removeEventListener("keydown", handleKeyInteraction);
      window.removeEventListener("scroll", handleScrollInteraction);
      window.removeEventListener("focus", handleFocusInteraction);
    };
  }, [currentStep, setLastInteractionTime, setShowWarning, setTimeLeft, TIMEOUT_DURATION]);
};

// handleShareCountSelect fonksiyonunu güncelleyelim
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
  updateShareCount: any;
  setSelectedSacrifice: (sacrifice: sacrificeSchema) => void;
  setFormData: (data: any[]) => void;
  goToStep: (step: string) => void;
  setIsDialogOpen: (open: boolean) => void;
  setLastInteractionTime: (time: number) => void;
  toast: any;
  transaction_id: string;
  createReservation: any;
}) => {
  try {
    console.log('Starting handleShareCountSelect function', { 
      shareCount, 
      transaction_id_length: transaction_id?.length,
      sacrifice_id: tempSelectedSacrifice?.sacrifice_id 
    });
    
    if (!tempSelectedSacrifice) {
      console.error('No sacrifice selected');
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kurbanlık seçimi yapılmadı.",
      });
      return;
    }

    if (!transaction_id || transaction_id.length !== 16) {
      console.error(`Invalid transaction_id: ${transaction_id}, length: ${transaction_id?.length}`);
      toast({
        variant: "destructive",
        title: "Sistem Hatası",
        description: "Geçersiz işlem kimliği. Lütfen sayfayı yenileyip tekrar deneyin.",
      });
      return;
    }

    console.log('Creating reservation with:', {
      transaction_id,
      sacrifice_id: tempSelectedSacrifice.sacrifice_id,
      share_count: shareCount
    });

    // Rezervasyon oluştur
    const result = await createReservation.mutateAsync({
      transaction_id,
      sacrifice_id: tempSelectedSacrifice.sacrifice_id,
      share_count: shareCount,
    });

    console.log('Reservation created successfully', result);

    // Set selected sacrifice and form data
    setSelectedSacrifice(tempSelectedSacrifice);
    
    // Form data'yı oluştur - burada is_purchaser değerini false olarak başlat
    setFormData(
      Array(shareCount).fill({
        name: "",
        phone: "",
        delivery_location: "",
        is_purchaser: false // Başlangıçta hiçbir hissedar "işlemi yapan kişi" olarak seçilmemiş olacak
      })
    );
    
    // Go to details step
    goToStep("details");
    setIsDialogOpen(false);
    setLastInteractionTime(Date.now());

    // Rezervasyon başarıyla oluşturulduğunda "Acele etmenize gerek yok" toast mesajını göster
    // Bir küçük gecikme ile gösteriyoruz ki, kullanıcı sayfa değişimini fark etsin
    setTimeout(() => {
      toast({
        title: "Acele etmenize gerek yok",
        description:
          "Bilgilerinizi doldurduğunuz süre boyunca, seçtiğiniz hisseler sistem tarafından ayrılır ve başka kullanıcılar tarafından işleme açılamaz.",
        duration: 10000,
      });
    }, 500);
  } catch (err) {
    console.error('Error selecting share count:', err);
    
    // Daha detaylı hata mesajı göster
    let errorMessage = "İşlem sırasında bir hata oluştu.";
    
    // API yanıtından gelen hata mesajını göster (eğer varsa)
    if (err instanceof Error) {
      errorMessage = err.message;
      
      // transaction_id uzunluk hatasını tespit et ve daha kullanıcı dostu mesaj göster
      if (errorMessage.includes('transaction_id') && errorMessage.includes('length')) {
        errorMessage = "Sistem hatası: İşlem kodu uyumsuz. Lütfen sayfayı yenileyip tekrar deneyin.";
      }
    }
    
    toast({
      variant: "destructive",
      title: "Hata",
      description: errorMessage,
    });
    
    // Dialog'u kapat ve seçim ekranına dön
    setIsDialogOpen(false);
  }
};

/**
 * Form verileriyle hissedarları oluşturur ve başarı durumuna geçer
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
  formData: any[];
  createShareholders: any;
  setSuccess: (success: boolean) => void;
  goToStep: (step: string) => void;
  toast: any;
}) => {
  // The actual approval and shareholder creation now happens in shareholder-summary.tsx
  // This function is now just handling the success state transition
  setSuccess(true);
  goToStep("success");
};

// useHandleNavigationHistory fonksiyonunu güncelleyelim
export const useHandleNavigationHistory = ({
  currentStep,
  selectedSacrifice,
  formData,
  updateShareCount,
  resetStore,
  goToStep,
  isSuccess,
  toast
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: any[];
  updateShareCount: any;
  resetStore: () => void;
  goToStep: (step: string) => void;
  isSuccess: boolean;
  toast: any;
}) => {
  const transaction_id = useReservationStore(state => state.transaction_id);
  const cancelReservation = useCancelReservation();

  useEffect(() => {
    const handleRouteChange = async (): Promise<boolean> => {
      if (isSuccess) return true;
      if (currentStep !== "details" && currentStep !== "confirmation") return true;
      if (!selectedSacrifice || !formData.length) return true;
      if (!transaction_id) return true;

      try {
        // Browser geri tuşu veya sayfa değişikliği durumunda rezervasyonu iptal et
        await cancelReservation.mutateAsync({
          transaction_id
        });

        resetStore();
        goToStep("selection");
        return true;
      } catch (err) {
        console.error('Error handling route change:', err);
        return false;
      }
    };

    const handlePopState = async (event: PopStateEvent) => {
      const result = await handleRouteChange();
      if (!result) {
        event.preventDefault();
        history.pushState(null, "", window.location.href);
      }
    };

    function createHistoryStateHandler(originalFn: (data: unknown, unused: string, url?: string | URL | null) => void) {
      return function(this: History, data: unknown, unused: string, url?: string | URL | null) {
        if (url) {
          handleRouteChange().then((shouldContinue) => {
            if (shouldContinue) {
              originalFn.apply(this, [data, unused, url] as [unknown, string, string | URL | null]);
            }
          });
        }
      };
    }

    window.addEventListener("popstate", handlePopState);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = createHistoryStateHandler(originalPushState);
    window.history.replaceState = createHistoryStateHandler(originalReplaceState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [
    currentStep,
    selectedSacrifice,
    formData,
    updateShareCount,
    resetStore,
    goToStep,
    isSuccess,
    toast,
    transaction_id,
    cancelReservation
  ]);
};
