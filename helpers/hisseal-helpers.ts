import { supabase } from "@/utils/supabaseClient";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useUpdateSacrifice } from "@/hooks/useSacrifices";
import { useCreateReservation, useCancelReservation, useTimeoutReservation } from "@/hooks/useReservations";
import { sacrificeSchema, Step } from "@/types";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";

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
  formData,
  isSuccess,
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: any[];
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
  WARNING_THRESHOLD: number,
  // Yeni parametreler - açık dialog kontrolü için
  openDialogs?: {
    isDialogOpen?: boolean;
    setIsDialogOpen?: (open: boolean) => void;
    showReservationInfo?: boolean;
    setShowReservationInfo?: (show: boolean) => void;
    showThreeMinuteWarning?: boolean;
    setShowThreeMinuteWarning?: (show: boolean) => void;
    showOneMinuteWarning?: boolean;
    setShowOneMinuteWarning?: (show: boolean) => void;
  },
  // Veri yenileme fonksiyonu (isteğe bağlı)
  refetchSacrifices?: () => Promise<any>,
  // Özel timeout handler fonksiyonu (isteğe bağlı)
  customTimeoutHandler?: () => void
) => {
  const timeoutReservation = useTimeoutReservation();
  const transaction_id = useReservationIDStore(state => state.transaction_id);

  useEffect(() => {
    // Success state'de timeout kontrolünü devre dışı bırak
    if (isSuccess) return;
    
    // Yalnızca details ve confirmation adımlarında timeout kontrolü yap
    if (currentStep !== "details" && currentStep !== "confirmation") return;
    
    // Gerekli veriler yoksa timeout kontrolünü devre dışı bırak
    if (!selectedSacrifice || !formData.length) return;
    
    // Timeout kontrolü için interval
    const interval = setInterval(async () => {
      const now = Date.now();
      const elapsed = (now - lastInteractionTime) / 1000; // saniye
      const timeLeft = Math.max(0, TIMEOUT_DURATION - elapsed);
      
      // Kalan süreyi güncelle
      setTimeLeft(Math.floor(timeLeft));
      
      // Eğer warn threshold'u aşıldıysa uyarıyı göster
      if (timeLeft <= WARNING_THRESHOLD && !showWarning) {
        setShowWarning(true);
      }
      
      // Eğer süre doldu ve hala details veya confirmation adımındaysak
      if (timeLeft <= 0 && (currentStep === "details" || currentStep === "confirmation")) {
        // Uyarıyı kapat - this must happen before any other timeout handling
        setShowWarning(false);

        // Açık dialogları kapat
        if (openDialogs) {
          // Hisse seçme dialog
          if (openDialogs.setIsDialogOpen && openDialogs.isDialogOpen) {
            openDialogs.setIsDialogOpen(false);
          }
          
          // Rezervasyon bilgi dialog
          if (openDialogs.setShowReservationInfo && openDialogs.showReservationInfo) {
            openDialogs.setShowReservationInfo(false);
          }
          
          // 3 dakika uyarı dialog
          if (openDialogs.setShowThreeMinuteWarning && openDialogs.showThreeMinuteWarning) {
            openDialogs.setShowThreeMinuteWarning(false);
          }
          
          // 1 dakika uyarı dialog
          if (openDialogs.setShowOneMinuteWarning && openDialogs.showOneMinuteWarning) {
            openDialogs.setShowOneMinuteWarning(false);
          }
        }
        
        // Özel timeout handler varsa onu kullan, yoksa standart işlemi yap
        if (customTimeoutHandler) {
          console.log("Using custom timeout handler");
          customTimeoutHandler();
        } else {
          console.log("Using default timeout handler");
          // Eğer transaction_id varsa rezervasyonu zaman aşımına uğrat
          if (transaction_id) {
            try {
              await timeoutReservation.mutateAsync({
                transaction_id
              });
              
              // Store'u sıfırla ve selection adımına git
              resetStore();
              goToStep("selection");
              
              // Veri yenileme fonksiyonu varsa çağır - Tablo görünümüne döndüğümüzde tüm verileri yenilemek için
              if (refetchSacrifices) {
                // setTimeout kullanarak resetStore işleminin tamamlanmasını bekleyelim
                setTimeout(() => {
                  console.log("Timeout sonrası veri yenileniyor...");
                  refetchSacrifices();
                }, 100);
              }
            } catch (err) {
              console.error('Error timing out reservation:', err);
              // Hata olsa bile reset yapmaya çalış
              resetStore();
              goToStep("selection");
              
              // Hata durumunda da veri yenileme fonksiyonunu çağır
              if (refetchSacrifices) {
                setTimeout(() => {
                  console.log("Hata durumunda veri yenileniyor...");
                  refetchSacrifices();
                }, 100);
              }
            }
          } else {
            // transaction_id yoksa direkt olarak reset yap
            resetStore();
            goToStep("selection");
            
            // Bu durumda da veri yenileme fonksiyonunu çağır
            if (refetchSacrifices) {
              setTimeout(() => {
                console.log("transaction_id yokken veri yenileniyor...");
                refetchSacrifices();
              }, 100);
            }
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [
    isSuccess, // Success state değişikliklerini dinle
    currentStep,
    lastInteractionTime,
    TIMEOUT_DURATION,
    WARNING_THRESHOLD,
    showWarning,
    selectedSacrifice,
    formData,
    transaction_id,
    resetStore,
    goToStep,
    setShowWarning,
    setTimeLeft,
    timeoutReservation,
    openDialogs, // Yeni dependency
    refetchSacrifices, // Yeni dependency
    customTimeoutHandler // Yeni custom handler dependency
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
    
    // Close the share selection dialog
    setIsDialogOpen(false);
    setLastInteractionTime(Date.now());
    
    // Note: We no longer automatically navigate to the details step or show the toast
    // This is now handled in the page component by showing the ReservationInfoDialog first
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
  setHasNavigatedAway,
  toast,
  openDialogs
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: any[];
  updateShareCount: any;
  resetStore: () => void;
  goToStep: (step: string) => void;
  isSuccess: boolean;
  setHasNavigatedAway: (value: boolean) => void;
  toast: any;
  openDialogs?: {
    isDialogOpen?: boolean;
    setIsDialogOpen?: (open: boolean) => void;
    showReservationInfo?: boolean;
    setShowReservationInfo?: (show: boolean) => void;
    showThreeMinuteWarning?: boolean;
    setShowThreeMinuteWarning?: (show: boolean) => void;
    showOneMinuteWarning?: boolean;
    setShowOneMinuteWarning?: (show: boolean) => void;
  }
}) => {
  const transaction_id = useReservationIDStore(state => state.transaction_id);
  const cancelReservation = useCancelReservation();

  useEffect(() => {
    const handleRouteChange = async (): Promise<boolean> => {
      // Success state'de navigasyon kontrollerini devre dışı bırak
      if (isSuccess) return true;
      
      // Sadece details ve confirmation adımlarında kontrol yap
      if (currentStep !== "details" && currentStep !== "confirmation") return true;
      
      // Gerekli veriler yoksa kontrolü devre dışı bırak
      if (!selectedSacrifice || !formData.length) return true;
      if (!transaction_id) return true;

      try {
        // Açık dialogları kapat
        if (openDialogs) {
          // Hisse seçme dialog
          if (openDialogs.setIsDialogOpen && openDialogs.isDialogOpen) {
            openDialogs.setIsDialogOpen(false);
          }
          
          // Rezervasyon bilgi dialog
          if (openDialogs.setShowReservationInfo && openDialogs.showReservationInfo) {
            openDialogs.setShowReservationInfo(false);
          }
          
          // 3 dakika uyarı dialog
          if (openDialogs.setShowThreeMinuteWarning && openDialogs.showThreeMinuteWarning) {
            openDialogs.setShowThreeMinuteWarning(false);
          }
          
          // 1 dakika uyarı dialog
          if (openDialogs.setShowOneMinuteWarning && openDialogs.showOneMinuteWarning) {
            openDialogs.setShowOneMinuteWarning(false);
          }
        }
        
        // Browser geri tuşu veya sayfa değişikliği durumunda rezervasyonu iptal et
        await cancelReservation.mutateAsync({
          transaction_id
        });

        resetStore();
      } catch (err) {
        console.error('Error canceling reservation during navigation:', err);
      }

      // If we're in success state, mark that we've navigated away
      if (isSuccess) {
        console.log('Navigation detected in success state, setting navigated away flag');
        setHasNavigatedAway(true);
      }
      
      return true;
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
    cancelReservation,
    setHasNavigatedAway,
    openDialogs // Yeni dependency
  ]);
};
