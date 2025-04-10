import { supabase } from "@/utils/supabaseClient";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useUpdateSacrifice } from "@/hooks/useSacrifices";
import { sacrificeSchema, Step } from "@/types";

// Define a more generic type for form data that matches what's used in the page component
export interface FormData {
  name: string;
  phone: string;
  delivery_location: string;
}

// API route for resetting shares
const RESET_SHARES_API = "/api/reset-shares";

// Sayfa kapatma/yenileme durumunda DB güncelleme
export const setupPageUnloadHandlers = ({
  currentStep,
  selectedSacrifice,
  formData,
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: any[];
}) => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    // Sadece 2. ve 3. adımda çalışsın
    if (currentStep !== "details" && currentStep !== "confirmation") return;
    if (!selectedSacrifice || !formData.length) return;

    // Tarayıcının standart onay mesajını göster
    e.preventDefault();
    e.returnValue = "";
  };

  const handleUnload = () => {
    // Sadece 2. ve 3. adımda çalışsın
    if (currentStep !== "details" && currentStep !== "confirmation") return;
    if (!selectedSacrifice || !formData.length) return;

    // Beacon API ile güncelleme yap - boş hisse sayısını artıralım
    const updateData = {
      sacrifice_id: selectedSacrifice.sacrifice_id,
      share_count: formData.length, // Kaç hisse ekleneceğini belirt
    };

    const blob = new Blob([JSON.stringify(updateData)], {
      type: "application/json",
    });
    
    // sendBeacon API kullan - sayfa kapanırken bile çalışır
    navigator.sendBeacon(RESET_SHARES_API, blob);
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
  useEffect(() => {
    const { handleBeforeUnload, handleUnload } = setupPageUnloadHandlers({
      currentStep,
      selectedSacrifice,
      formData
    });

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, [currentStep, selectedSacrifice, formData]);
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
  updateSacrifice: any,
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

  useEffect(() => {
    if (isSuccess) return;

    const checkTimeout = async () => {
      if (currentStep !== "details" && currentStep !== "confirmation") return;

      const timePassed = Math.floor((Date.now() - lastInteractionTime) / 1000);
      const remaining = TIMEOUT_DURATION - timePassed;

      if (remaining <= 0) {
        try {
          if (selectedSacrifice) {
            const { data: currentSacrifice, error: fetchError } = await supabase
              .from("sacrifice_animals")
              .select("empty_share")
              .eq("sacrifice_id", selectedSacrifice.sacrifice_id)
              .single();

            if (fetchError || !currentSacrifice) {
              toast({
                variant: "destructive",
                title: "Hata",
                description:
                  "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
              });
              return;
            }

            await updateSacrifice.mutateAsync({
              sacrificeId: selectedSacrifice.sacrifice_id,
              emptyShare: currentSacrifice.empty_share + formData.length,
            });
          }
        } catch (err) {
          console.error('Error handling timeout:', err);
          toast({
            variant: "destructive",
            title: "Hata",
            description: "İşlem sırasında bir hata oluştu.",
          });
        } finally {
          setShowWarning(false);
          goToStep("selection");
          resetStore();
          setTimeLeft(TIMEOUT_DURATION);
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
    updateSacrifice,
    goToStep,
    resetStore,
    isSuccess,
    toast,
    TIMEOUT_DURATION,
    WARNING_THRESHOLD,
    setShowWarning,
    setTimeLeft
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

// handleShareCountSelect fonksiyonu
export const handleShareCountSelect = async ({
  shareCount,
  tempSelectedSacrifice,
  updateSacrifice,
  setSelectedSacrifice,
  setFormData,
  goToStep,
  setIsDialogOpen,
  setLastInteractionTime,
  toast
}: {
  shareCount: number;
  tempSelectedSacrifice: sacrificeSchema | null;
  updateSacrifice: any;
  setSelectedSacrifice: (sacrifice: sacrificeSchema) => void;
  setFormData: (data: any[]) => void;
  goToStep: (step: string) => void;
  setIsDialogOpen: (open: boolean) => void;
  setLastInteractionTime: (time: number) => void;
  toast: any;
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

    const { data: currentSacrifice } = await supabase
      .from("sacrifice_animals")
      .select("empty_share")
      .eq("sacrifice_id", tempSelectedSacrifice.sacrifice_id)
      .single();

    if (!currentSacrifice) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kurbanlık bilgileri alınamadı.",
      });
      return;
    }

    await updateSacrifice.mutateAsync({
      sacrificeId: tempSelectedSacrifice.sacrifice_id,
      emptyShare: currentSacrifice.empty_share - shareCount,
    });

    setSelectedSacrifice(tempSelectedSacrifice);
    setFormData(
      Array(shareCount).fill({
        name: "",
        phone: "",
        delivery_location: "",
      })
    );
    goToStep("details");
    setIsDialogOpen(false);
    setLastInteractionTime(Date.now());
  } catch (err) {
    console.error('Error selecting share count:', err);
    toast({
      variant: "destructive",
      title: "Hata",
      description: "İşlem sırasında bir hata oluştu.",
    });
  }
};

/**
 * handleApprove - Hisse onay işlemi
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
  if (!selectedSacrifice || !formData) return;

  const shareholders = formData.map((data) => ({
    shareholder_name: data.name,
    phone_number: data.phone.startsWith("+90")
      ? data.phone
      : "+90" + data.phone.replace(/[^0-9]/g, ""),
    sacrifice_id: selectedSacrifice.sacrifice_id,
    share_price: selectedSacrifice.share_price,
    delivery_location: data.delivery_location,
    delivery_fee: data.delivery_location !== "kesimhane" ? 500 : 0,
    total_amount:
      selectedSacrifice.share_price +
      (data.delivery_location !== "kesimhane" ? 500 : 0),
    paid_amount: 0,
    remaining_payment:
      selectedSacrifice.share_price +
      (data.delivery_location !== "kesimhane" ? 500 : 0),
    sacrifice_consent: false,
    last_edited_by: data.name,
    purchased_by: data.name
  }));

  try {
    const result = await createShareholders.mutateAsync(shareholders);
    if (result !== null) {
      setSuccess(true);
      goToStep("success");
    }
  } catch (err) {
    console.error('Error approving shares:', err);
    toast({
      variant: "destructive",
      title: "Hata",
      description: "İşlem sırasında bir hata oluştu.",
    });
  }
};

/**
 * Hook to handle navigation history
 * Kullanıcı geri butonuna bastığında veya farklı bir sayfaya gitmeye çalıştığında
 * gerekli kontrolleri yaparak boş hisse sayısını güncellemek için kullanılır
 */
export const useHandleNavigationHistory = ({
  currentStep,
  selectedSacrifice,
  formData,
  updateSacrifice,
  resetStore,
  goToStep,
  isSuccess,
  toast
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: any[];
  updateSacrifice: any;
  resetStore: () => void;
  goToStep: (step: string) => void;
  isSuccess: boolean;
  toast: any;
}) => {
  useEffect(() => {
    const { handleRouteChange } = setupNavigationHandler({
      currentStep,
      selectedSacrifice,
      formData,
      updateSacrifice,
      resetStore,
      goToStep,
      isSuccess,
      toast
    });

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
