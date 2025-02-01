"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import React, { useState, useEffect, useRef } from "react";
import Checkout from "./components/Checkout";
import { columns } from "./components/columns";
import { ShareSelectDialog } from "./components/share-select-dialog";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter, usePathname } from "next/navigation";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { Button } from "@/components/ui/button";
import { useHisseStore } from "@/store/useHisseStore";
import { useSacrifices, useUpdateSacrifice } from "@/hooks/useSacrifices";
import { useCreateShareholders } from "@/hooks/useShareholders";
import ShareholderSummary from "./components/shareholder-summary"
import { supabase } from "@/utils/supabaseClient";
import { Check } from "lucide-react"
import { ShareFilters } from "./components/ShareFilters";
import { ColumnFiltersState } from "@tanstack/react-table";
import Link from "next/link";

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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
  }, [pathname, resetStore, goToStep]);

  const handleTimeout = async () => {
    if (currentStep !== "details" && currentStep !== "confirmation") return;
    if (!selectedSacrifice || !formData.length) return;

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
        return;
      }

      // Update empty_share in DB
      await updateSacrifice.mutateAsync({
        sacrificeId: selectedSacrifice.sacrifice_id,
        emptyShare: currentSacrifice.empty_share + formData.length,
      });

      // Reset store after successful update
      resetStore();
      goToStep("selection");
      
      // Clear timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      // Reset states
      setShowWarning(false);
      setTimeLeft(TIMEOUT_DURATION);
      
      toast({
        variant: "destructive",
        title: "Süre Doldu",
        description: "İşlem süresi dolduğu için form sıfırlandı.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
      });
    }
  };

  // Update useEffect for timeout
  useEffect(() => {
    if (currentStep === "details" || currentStep === "confirmation") {
      // Clear any existing timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Set up new interval for countdown
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastInteractionTime) / 1000);
        const remaining = TIMEOUT_DURATION - elapsed;

        if (remaining <= WARNING_THRESHOLD && !showWarning) {
          setShowWarning(true);
        }

        if (remaining <= 0) {
          handleTimeout();
        } else {
          setTimeLeft(remaining);
        }
      }, 1000) as NodeJS.Timeout;

      intervalRef.current = interval;

      // Set up timeout
      const timeout = setTimeout(handleTimeout, TIMEOUT_DURATION * 1000);
      timeoutRef.current = timeout;

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [currentStep, lastInteractionTime, showWarning]);

  // Handle user interactions
  useEffect(() => {
    const handleInteraction = () => {
      if (currentStep === "details" || currentStep === "confirmation") {
        setLastInteractionTime(Date.now());
        setShowWarning(false);
        setTimeLeft(TIMEOUT_DURATION);
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'focus'];
    events.forEach(event => window.addEventListener(event, handleInteraction));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleInteraction));
    };
  }, [currentStep]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (isSuccess) return; // Success durumunda uyarı gösterme
      if (currentStep !== "details" && currentStep !== "confirmation") return;
      if (!selectedSacrifice || !formData.length) return;

      e.preventDefault();
      e.returnValue = '';

      try {
        const { data: currentSacrifice } = await supabase
          .from("sacrifice_animals")
          .select("empty_share")
          .eq("sacrifice_id", selectedSacrifice.sacrifice_id)
          .single();

        if (currentSacrifice) {
          await updateSacrifice.mutateAsync({
            sacrificeId: selectedSacrifice.sacrifice_id,
            emptyShare: currentSacrifice.empty_share + formData.length,
          });
        }
      } catch (error) {
        console.error("Error updating sacrifice:", error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep, selectedSacrifice, formData, isSuccess]);

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

  const handleApprove = async () => {
    if (!selectedSacrifice || !formData.length) return;

    try {
      const shareholders = formData.map((data) => {
        const deliveryFee = data.delivery_location !== "kesimhane" ? 500 : 0;
        const sharePrice = selectedSacrifice.share_price;
        const totalAmount = sharePrice + deliveryFee;

        return {
          shareholder_name: data.name.trim(),
          phone_number: "+90" + data.phone.replace(/\D/g, '').replace(/^0/, ''),
          delivery_location: data.delivery_location,
          delivery_fee: deliveryFee,
          share_price: sharePrice,
          total_amount: totalAmount,
          paid_amount: 0,
          remaining_payment: totalAmount,
          sacrifice_consent: false,
          last_edited_by: data.name.trim(),
          purchased_by: data.name.trim(),
          sacrifice_id: selectedSacrifice.sacrifice_id,
        };
      });

      const result = await createShareholders.mutateAsync(shareholders);
      
      if (result !== null) {
        // Clear timers before updating state
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        // Update state in next tick to avoid render cycle issues
        setTimeout(() => {
          setIsSuccess(true);
        }, 0);
      }
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hissedar bilgileri kaydedilirken bir hata oluştu.",
      });
    }
  };

  // Return success UI if isSuccess is true
  if (isSuccess) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="w-20 h-20 rounded-full bg-[#F0FBF1] flex items-center justify-center">
          <Check className="w-10 h-10 text-[#39C645]" />
        </div>
        <h1 className="text-4xl font-semibold text-center">Teşekkürler</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Hisse kaydınız başarıyla tamamlanmıştır. Hisse bilgilerinizi görüntülemek için 
          <Link href="/hissesorgula" className="text-primary hover:underline ml-1">
            Hisse Sorgula
          </Link> sayfasını ziyaret edebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="container flex flex-col space-y-8">
      {!isSuccess && (
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
              {/* Progress steps */}
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
          <TabsContent value="tab-3">
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
