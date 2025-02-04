"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import React, { useState, useEffect } from "react";
import Checkout from "./components/Checkout";
import { columns } from "./components/columns";
import { ShareSelectDialog } from "./components/share-select-dialog";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter, usePathname } from "next/navigation";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { Button } from "@/components/ui/button";
import { useHisseStore } from "@/store/useHisseStore";
import { useSacrifices, useUpdateSacrifice, useCreateShareholders } from "@/hooks/useSacrifices";
import ShareholderSummary from "./components/shareholder-summary"
import { supabase } from "@/utils/supabaseClient";
import { Check } from "lucide-react"
import { ShareFilters } from "./components/ShareFilters";
import { ColumnFiltersState } from "@tanstack/react-table";

const TIMEOUT_DURATION = 10; // 3 minutes
const WARNING_THRESHOLD = 5; // Show warning at 1 minute

const Page = () => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "empty_share",
      value: ["1", "2", "3", "4", "5", "6", "7"]
    }
  ]);

  // Zustand store
  const {
    selectedSacrifice,
    tempSelectedSacrifice,
    formData,
    currentStep,
    stepNumber,
    tabValue,
    setSelectedSacrifice,
    setTempSelectedSacrifice,
    setFormData,
    goToStep,
    resetStore,
  } = useHisseStore();

  // React Query hooks
  const { data = [] } = useSacrifices();
  const updateSacrifice = useUpdateSacrifice();
  const createShareholders = useCreateShareholders();

  // Reset form state when entering the page
  useEffect(() => {
    if (pathname === "/hisseal") {
      resetStore();
      goToStep("selection");
    }
  }, [pathname]);

  // Handle navigation changes
  useEffect(() => {
    let isNavigating = false;

    const handleRouteChange = async (url: string) => {
      if (isNavigating) return true;
      
      // Only handle if we're in details or confirmation step
      if (currentStep !== "details" && currentStep !== "confirmation") return true;
      if (!selectedSacrifice || !formData.length) return true;

      isNavigating = true;

      try {
        // Get current sacrifice info
        const { data: currentSacrifice, error } = await supabase
          .from("sacrifice_animals")
          .select("empty_share")
          .eq("sacrifice_id", selectedSacrifice.sacrifice_id)
          .single();

        if (error || !currentSacrifice) {
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Kurbanlık bilgileri alınamadı.",
          });
          return false;
        }

        // Update empty_share in DB
        await updateSacrifice.mutateAsync({
          sacrificeId: selectedSacrifice.sacrifice_id,
          emptyShare: currentSacrifice.empty_share + formData.length,
        });

        // Reset store after successful update
        resetStore();
        goToStep("selection");
        return true;
      } catch (error) {
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
      const result = await handleRouteChange(window.location.href);
      if (!result) {
        event.preventDefault();
        history.pushState(null, '', window.location.href);
      }
    };

    // Listen for navigation events
    window.addEventListener('popstate', handlePopState);
    
    // Create a proxy for pushState and replaceState
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function() {
      const url = arguments[2] as string;
      const shouldContinue = handleRouteChange(url);
      if (shouldContinue) {
        return originalPushState.apply(this, arguments as any);
      }
      return undefined;
    };

    window.history.replaceState = function() {
      const url = arguments[2] as string;
      const shouldContinue = handleRouteChange(url);
      if (shouldContinue) {
        return originalReplaceState.apply(this, arguments as any);
      }
      return undefined;
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [currentStep, selectedSacrifice, formData, updateSacrifice, resetStore, goToStep]);

  // Handle interaction timeout
  useEffect(() => {
    const checkTimeout = async () => {
      if (currentStep !== "details" && currentStep !== "confirmation") return;

      const timePassed = Math.floor((Date.now() - lastInteractionTime) / 1000);
      const remaining = TIMEOUT_DURATION - timePassed;

      if (remaining <= 0) {
        try {
          if (selectedSacrifice) {
            // Önce güncel kurban bilgisini al
            const { data: currentSacrifice, error } = await supabase
              .from("sacrifice_animals")
              .select("empty_share")
              .eq("sacrifice_id", selectedSacrifice.sacrifice_id)
              .single();

            if (error || !currentSacrifice) {
              toast({
                variant: "destructive",
                title: "Hata",
                description: "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
              });
              return;
            }

            // DB'de empty_share'i form sayısı kadar artır
            await updateSacrifice.mutateAsync({
              sacrificeId: selectedSacrifice.sacrifice_id,
              emptyShare: currentSacrifice.empty_share + formData.length,
            });
          }
        } catch (error) {
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
        
        // Warning threshold kontrolü
        if (remaining <= WARNING_THRESHOLD && !showWarning) {
          setShowWarning(true);
        }
      }
    };

    const timer = setInterval(checkTimeout, 1000);
    return () => clearInterval(timer);
  }, [lastInteractionTime, showWarning, currentStep, goToStep, resetStore, selectedSacrifice, formData.length, updateSacrifice]);

  // Sayfa seviyesinde etkileşimleri takip et
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
      window.addEventListener('mousedown', handleMouseInteraction);
      window.addEventListener('keydown', handleKeyInteraction);
      window.addEventListener('scroll', handleScrollInteraction);
      window.addEventListener('focus', handleFocusInteraction);
    }

    return () => {
      window.removeEventListener('mousedown', handleMouseInteraction);
      window.removeEventListener('keydown', handleKeyInteraction);
      window.removeEventListener('scroll', handleScrollInteraction);
      window.removeEventListener('focus', handleFocusInteraction);
    };
  }, [currentStep, TIMEOUT_DURATION]);

  // Sayfa kapatma/yenileme durumunda DB güncelleme
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSuccess && (currentStep === "details" || currentStep === "confirmation")) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    const handleVisibilityChange = async () => {
      if (!isSuccess && document.visibilityState === "hidden" && (currentStep === "details" || currentStep === "confirmation")) {
        if (!selectedSacrifice || !formData) return;
        
        try {
          // Önce güncel kurban bilgisini al
          const { data: currentSacrifice, error } = await supabase
            .from("sacrifice_animals")
            .select("empty_share")
            .eq("sacrifice_id", selectedSacrifice.sacrifice_id)
            .single();

          if (error || !currentSacrifice) {
            console.error("Kurban bilgileri alınamadı:", error);
            return;
          }

          // Güncel empty_share değerini kullanarak güncelleme yap
          await updateSacrifice.mutateAsync({
            sacrificeId: selectedSacrifice.sacrifice_id,
            emptyShare: currentSacrifice.empty_share + formData.length,
          });
        } catch (error) {
          console.error("Hisse sayısı güncellenirken hata oluştu:", error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentStep, selectedSacrifice, formData, isSuccess]);

  // Timer effect
  useEffect(() => {
    if (isSuccess) return; // Success state'inde timer'ı durdur

    if (currentStep === "details" || currentStep === "confirmation") {
      const timer = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastInteractionTime) / 1000);
        const remaining = Math.max(0, TIMEOUT_DURATION - elapsed);

        setTimeLeft(remaining);

        if (remaining <= WARNING_THRESHOLD && remaining > 0 && !showWarning) {
          setShowWarning(true);
        }

        if (remaining === 0) {
          handleTimeout();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStep, lastInteractionTime, showWarning, isSuccess]);

  const handleSacrificeSelect = async (sacrifice: any) => {
    setTempSelectedSacrifice(sacrifice);
    setIsDialogOpen(true);
  };

  const handleShareCountSelect = async (shareCount: number) => {
    if (!tempSelectedSacrifice) return;

    try {
      await updateSacrifice.mutateAsync({
        sacrificeId: tempSelectedSacrifice.sacrifice_id,
        emptyShare: tempSelectedSacrifice.empty_share - shareCount,
      });

      setSelectedSacrifice(tempSelectedSacrifice);
      setFormData(Array(shareCount).fill({
        name: "",
        phone: "",
        delivery_location: "",
      }));
      goToStep("details");
      setIsDialogOpen(false);
      setLastInteractionTime(Date.now());
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleTimeout = async () => {
    if (!selectedSacrifice || !formData) return;
    
    try {
      // Önce güncel kurban bilgisini al
      const { data: currentSacrifice, error } = await supabase
        .from("sacrifice_animals")
        .select("empty_share")
        .eq("sacrifice_id", selectedSacrifice.sacrifice_id)
        .single();

      if (error || !currentSacrifice) {
        console.error("Kurban bilgileri alınamadı:", error);
        return;
      }

      // Güncel empty_share değerini kullanarak güncelleme yap
      await updateSacrifice.mutateAsync({
        sacrificeId: selectedSacrifice.sacrifice_id,
        emptyShare: currentSacrifice.empty_share + formData.length,
      });
      
      // Store'u sıfırla ve ilk adıma dön
      resetStore();
      goToStep("selection");
    } catch (error) {
      console.error("Hisse sayısı güncellenirken hata oluştu:", error);
    }
  };

  const handleApprove = async () => {
    if (!selectedSacrifice || !formData) return;

    // Format phone numbers and prepare data
    const shareholders = formData.map((data) => ({
      shareholder_name: data.name,
      phone_number: "+90" + data.phone.replace(/\D/g, "").replace(/^0/, "").slice(-10),
      sacrifice_id: selectedSacrifice.sacrifice_id,
      share_price: selectedSacrifice.share_price,
      delivery_location: data.delivery_location,
      delivery_fee: data.delivery_location !== "kesimhane" ? 500 : 0,
      total_amount: selectedSacrifice.share_price + (data.delivery_location !== "kesimhane" ? 500 : 0),
      paid_amount: 0,
      remaining_payment: selectedSacrifice.share_price + (data.delivery_location !== "kesimhane" ? 500 : 0),
      sacrifice_consent: false,
    }));

    try {
      const result = await createShareholders.mutateAsync(shareholders);
      if (Array.isArray(result) && result.length > 0) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Error creating shareholders:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hissedarlar kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  return (
    <div className="container flex flex-col space-y-8">
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <h1 className="text-4xl font-semibold text-primary">Teşekkürler</h1>
          <p className="text-muted-foreground text-center">
            Hisse kaydınız başarıyla tamamlanmıştır.<br />
            Telefonunuza gönderilen SMS ile hisse bilgilerinizi sorgulayabilirsiniz.
          </p>
        </div>
      ) : (
        <Tabs value={tabValue} onValueChange={(value) => {
          switch (value) {
            case "tab-1":
              goToStep("selection");
              break;
            case "tab-2":
              goToStep("details");
              break;
            case "tab-3":
              goToStep("confirmation");
              break;
          }
        }} className="w-full">
          <div className="relative mt-12 mb-16">
            <div className="w-full flex justify-between items-start">
              {/* Step 1 */}
              <div className="flex flex-col items-start">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium transition-all duration-300
                    ${stepNumber >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    {stepNumber > 1 ? <Check className="h-5 w-5" /> : "1"}
                  </div>
                  <h3 className={`ml-3 text-lg font-semibold ${stepNumber >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    Hisse Seçimi
                  </h3>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-start">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium transition-all duration-300
                    ${stepNumber >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    {stepNumber > 2 ? <Check className="h-5 w-5" /> : "2"}
                  </div>
                  <h3 className={`ml-3 text-lg font-semibold ${stepNumber >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    Hissedar Bilgileri
                  </h3>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-start">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium transition-all duration-300
                    ${stepNumber === 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    3
                  </div>
                  <h3 className={`ml-3 text-lg font-semibold ${stepNumber >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    Hisse Onay
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="tab-1">
            <CustomDataTable 
              data={data} 
              columns={columns} 
              meta={{
                onSacrificeSelect: handleSacrificeSelect
              }}
              pageSizeOptions={[10, 20, 50, 100, 150]}
              filters={({ table, columnFilters, onColumnFiltersChange }) => (
                <ShareFilters 
                  table={table} 
                  columnFilters={columnFilters}
                  onColumnFiltersChange={onColumnFiltersChange} 
                />
              )}
            />
          </TabsContent>
          <TabsContent value="tab-2">
            <Checkout 
              sacrifice={selectedSacrifice} 
              formData={formData} 
              setFormData={setFormData}
              onApprove={() => goToStep("confirmation")}
              resetStore={resetStore}
              setCurrentStep={goToStep}
              setLastInteractionTime={setLastInteractionTime}
              onBack={async (shareCount) => {
                if (!selectedSacrifice) return;
                
                try {
                  // Önce güncel kurban bilgisini al
                  const { data: currentSacrifice, error } = await supabase
                    .from("sacrifice_animals")
                    .select("empty_share")
                    .eq("sacrifice_id", selectedSacrifice.sacrifice_id)
                    .single();

                  if (error || !currentSacrifice) {
                    toast({
                      variant: "destructive",
                      title: "Hata",
                      description: "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
                    });
                    return;
                  }

                  // Güncel empty_share değerini kullanarak güncelleme yap
                  await updateSacrifice.mutateAsync({
                    sacrificeId: selectedSacrifice.sacrifice_id,
                    emptyShare: currentSacrifice.empty_share + shareCount,
                  });
                  
                  // Store'u sıfırla
                  resetStore();
                  // İlk adıma dön
                  goToStep("selection");
                } catch (error) {
                  // Error is handled in the mutation
                }
              }}
            />
          </TabsContent>
          <TabsContent value="tab-3" className="space-y-8">
            <ShareholderSummary 
              sacrifice={selectedSacrifice}
              shareholders={formData}
              onApprove={handleApprove}
              setCurrentStep={goToStep}
              remainingTime={timeLeft}
              setRemainingTime={setTimeLeft}
            />
          </TabsContent>
        </Tabs>
      )}

      {(currentStep === "details" || currentStep === "confirmation") && !isSuccess && (
        <div className="text-sm text-muted-foreground text-center mt-auto mb-8">
          Kalan Süre: {timeLeft} saniye
        </div>
      )}

      {tempSelectedSacrifice && !isSuccess && (
        <ShareSelectDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          sacrifice={tempSelectedSacrifice}
          onSelect={handleShareCountSelect}
        />
      )}
      
      <AlertDialog open={showWarning && !isSuccess} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogTitle>Uyarı</AlertDialogTitle>
          <AlertDialogDescription>
            {timeLeft} saniye içerisinde işlem yapmazsanız hisse seçim sayfasına yönlendirileceksiniz.
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Page;
