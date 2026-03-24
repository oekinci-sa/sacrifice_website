import { useToast } from "@/components/ui/use-toast";
import { useUpdateSacrifice } from "@/hooks/useSacrifices";
import { sacrificeSchema, Step } from "@/types";
import { useEffect } from "react";
import { FormData } from "./types";

type NavigationHandlerParams = {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: unknown[];
  updateSacrifice: { mutate: (args: { sacrificeId: string; emptyShare: number }) => void };
  resetStore: () => void;
  goToStep: (step: string) => void;
  isSuccess: boolean;
  toast: (opts: { variant?: string; title?: string; description?: string }) => void;
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
    if (currentStep !== "details" && currentStep !== "confirmation") return true;
    if (!selectedSacrifice || !(formData as unknown[]).length) return true;

    isNavigating = true;

    try {
      const res = await fetch(
        `/api/get-latest-sacrifice-share?id=${encodeURIComponent(selectedSacrifice.sacrifice_id)}`
      );
      const currentSacrifice = res.ok ? await res.json() : null;

      if (!currentSacrifice || typeof currentSacrifice.empty_share !== "number") {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kurbanlık bilgileri alınamadı.",
        });
        return false;
      }

      await updateSacrifice.mutate({
        sacrificeId: selectedSacrifice.sacrifice_id,
        emptyShare: currentSacrifice.empty_share + (formData as unknown[]).length,
      });

      resetStore();
      goToStep("selection");
      return true;
    } catch {
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
      if (currentStep !== "details" && currentStep !== "confirmation") return true;
      if (!selectedSacrifice || !formData.length) return true;

      isNavigating = true;

      try {
        const res = await fetch(
          `/api/get-latest-sacrifice-share?id=${encodeURIComponent(selectedSacrifice.sacrifice_id)}`
        );
        const currentSacrifice = res.ok ? await res.json() : null;

        if (!currentSacrifice || typeof currentSacrifice.empty_share !== "number") {
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Kurbanlık bilgileri alınamadı.",
          });
          return false;
        }

        await updateSacrifice.mutate({
          sacrificeId: selectedSacrifice.sacrifice_id,
          emptyShare: currentSacrifice.empty_share + formData.length,
        });

        resetStore();
        goToStep("selection");
        return true;
      } catch {
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

    function createHistoryStateHandler(originalFn: (data: unknown, unused: string, url?: string | URL | null) => void) {
      return function (this: History, data: unknown, unused: string, url?: string | URL | null) {
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
    updateSacrifice,
    resetStore,
    goToStep,
    isSuccess,
    toast,
  ]);
};
