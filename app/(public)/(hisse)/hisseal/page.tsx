"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import React, { useState, useEffect } from "react";
import Checkout from "./components/Checkout";
import { columns } from "./components/columns";
import { ShareSelectDialog } from "./components/share-select-dialog";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { Button } from "@/components/ui/button";
import { useHisseStore } from "@/store/useHisseStore";
import { useSacrifices, useUpdateSacrifice, useCreateShareholders } from "@/hooks/useSacrifices";
import ShareholderSummary from "./components/shareholder-summary"
import { supabase } from "@/utils/supabaseClient";
import { Check } from "lucide-react"

const TIMEOUT_DURATION = 10; // 3 minutes
const WARNING_THRESHOLD = 5; // Show warning at 1 minute

const Page = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);

  // Zustand store
  const {
    selectedSacrifice,
    tempSelectedSacrifice,
    formData,
    currentStep,
    setSelectedSacrifice,
    setTempSelectedSacrifice,
    setFormData,
    setCurrentStep: setStoreCurrentStep,
    resetStore,
  } = useHisseStore();

  // React Query hooks
  const { data = [] } = useSacrifices();
  const updateSacrifice = useUpdateSacrifice();
  const createShareholders = useCreateShareholders();

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
          setStoreCurrentStep("selection");
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
  }, [lastInteractionTime, showWarning, currentStep, setStoreCurrentStep, resetStore, selectedSacrifice, formData.length, updateSacrifice]);

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
      // Sadece 2. ve 3. adımda çalışsın
      if (currentStep !== "details" && currentStep !== "confirmation") return;
      if (!selectedSacrifice || !formData.length) return;

      // Tarayıcının standart onay mesajını göster
      e.preventDefault();
      e.returnValue = '';
    };

    const handleUnload = () => {
      // Sadece 2. ve 3. adımda çalışsın
      if (currentStep !== "details" && currentStep !== "confirmation") return;
      if (!selectedSacrifice || !formData.length) return;

      // Beacon API ile güncelleme yap
      const updateData = {
        sacrifice_id: selectedSacrifice.sacrifice_id,
        form_count: formData.length
      };

      const blob = new Blob([JSON.stringify(updateData)], { type: 'application/json' });
      navigator.sendBeacon('/api/update-sacrifice', blob);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [currentStep, selectedSacrifice, formData]);

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
      setStoreCurrentStep("details");
      setIsDialogOpen(false);
      setLastInteractionTime(Date.now());
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleApprove = async () => {
    if (!selectedSacrifice || !formData) return;

    // Format phone numbers and prepare data
    const shareholders = formData.map((data) => ({
      shareholder_name: data.name,
      phone_number: data.phone.startsWith("+90")
        ? data.phone
        : "+90" + data.phone.replace(/[^0-9]/g, ""),
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
      await createShareholders.mutateAsync(shareholders);
      router.push("/hissesorgula");
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  // Helper function to get step number
  const getCurrentStep = () => {
    switch (currentStep) {
      case "selection":
        return 1;
      case "details":
        return 2;
      case "confirmation":
        return 3;
      default:
        return 1;
    }
  };

  // Helper function to get tab value
  const getTabValue = () => {
    switch (currentStep) {
      case "selection":
        return "tab-1";
      case "details":
        return "tab-2";
      case "confirmation":
        return "tab-3";
      default:
        return "tab-1";
    }
  };

  return (
    <div className="container flex flex-col space-y-8">
      <Tabs value={getTabValue()} onValueChange={(value) => {
        switch (value) {
          case "tab-1":
            setStoreCurrentStep("selection");
            break;
          case "tab-2":
            setStoreCurrentStep("details");
            break;
          case "tab-3":
            setStoreCurrentStep("confirmation");
            break;
        }
      }} className="w-full">
        <div className="relative mt-12 mb-16">
          <div className="w-full flex justify-between items-start">
            {/* Step 1 */}
            <div className="flex flex-col items-start">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium transition-all duration-300
                  ${getCurrentStep() > 1 ? 'bg-primary text-white' : getCurrentStep() === 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                >
                  {getCurrentStep() > 1 ? (
                    <Check className="w-6 h-6 animate-[check_0.3s_ease-in-out]" />
                  ) : (
                    "1"
                  )}
                </div>
                <h3 className={`ml-3 text-lg font-semibold ${getCurrentStep() >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  Hisse Seçim
                </h3>
              </div>
            </div>

            {/* Connector Line 1 */}
            <div className="flex-1 flex items-center mx-4">
              <div className="h-0.5 bg-muted w-full mt-5" />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-start">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium transition-all duration-300
                  ${getCurrentStep() > 2 ? 'bg-primary text-white' : getCurrentStep() === 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                >
                  {getCurrentStep() > 2 ? (
                    <Check className="w-6 h-6 animate-[check_0.3s_ease-in-out]" />
                  ) : (
                    "2"
                  )}
                </div>
                <h3 className={`ml-3 text-lg font-semibold ${getCurrentStep() >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  Hissedar Bilgileri
                </h3>
              </div>
            </div>

            {/* Connector Line 2 */}
            <div className="flex-1 flex items-center mx-4">
              <div className="h-0.5 bg-muted w-full mt-5" />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-start">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium transition-all duration-300
                  ${getCurrentStep() === 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                >
                  3
                </div>
                <h3 className={`ml-3 text-lg font-semibold ${getCurrentStep() >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
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
          />
        </TabsContent>
        <TabsContent value="tab-2">
          <Checkout 
            sacrifice={selectedSacrifice} 
            formData={formData} 
            setFormData={setFormData}
            onApprove={() => setStoreCurrentStep("confirmation")}
            resetStore={resetStore}
            setCurrentStep={setStoreCurrentStep}
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
                setStoreCurrentStep("selection");
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
            setCurrentStep={setStoreCurrentStep}
            remainingTime={timeLeft}
            setRemainingTime={setTimeLeft}
          />
        </TabsContent>
      </Tabs>

      {(currentStep === "details" || currentStep === "confirmation") && (
        <div className="text-sm text-muted-foreground text-center mt-auto mb-8">
          Kalan Süre: {timeLeft} saniye
        </div>
      )}

      {tempSelectedSacrifice && (
        <ShareSelectDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          sacrifice={tempSelectedSacrifice}
          onSelect={handleShareCountSelect}
        />
      )}
      
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
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
