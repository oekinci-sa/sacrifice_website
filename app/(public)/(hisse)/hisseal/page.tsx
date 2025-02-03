"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import React, { useState, useEffect } from "react";
import Checkout from "./components/shareholder-info-step/checkout";
import { columns } from "./components/table-step/columns";
import { ShareSelectDialog } from "./components/table-step/share-select-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { useHisseStore } from "@/stores/useHisseStore";
import {
  useSacrifices,
  useUpdateSacrifice,
} from "@/hooks/useSacrifices";
import { useCreateShareholders } from "@/hooks/useShareholders";
import ShareholderSummary from "./components/confirmation-step/shareholder-summary";
import { supabase } from "@/utils/supabaseClient";
import { ShareFilters } from "./components/table-step/ShareFilters";
import { ColumnFiltersState } from "@tanstack/react-table";
import { TripleInfo } from "@/app/(public)/components/triple-info"
import ProgressBar from "./components/common/progress-bar";
import { Check } from "lucide-react";

const TIMEOUT_DURATION = 1000; // 3 minutes
const WARNING_THRESHOLD = 5; // Show warning at 1 minute

const Page = () => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "empty_share",
      value: ["1", "2", "3", "4", "5", "6", "7"],
    },
  ]);

  // Zustand store
  const {
    selectedSacrifice,
    tempSelectedSacrifice,
    formData,
    currentStep,
    stepNumber,
    tabValue,
    isSuccess,
    setSelectedSacrifice,
    setTempSelectedSacrifice,
    setFormData,
    goToStep,
    resetStore,
    setSuccess,
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

    const handleRouteChange = async (url: string): Promise<boolean> => {
      if (isNavigating) return true;
      if (isSuccess) return true;

      if (currentStep !== "details" && currentStep !== "confirmation")
        return true;
      if (!selectedSacrifice || !formData.length) return true;

      isNavigating = true;

      try {
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

        await updateSacrifice.mutateAsync({
          sacrificeId: selectedSacrifice.sacrifice_id,
          emptyShare: currentSacrifice.empty_share + formData.length,
        });

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
        history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    function createHistoryStateHandler(originalFn: Function) {
      return function(this: typeof window.history, data: any, unused: string, url?: string) {
        const args: [any, string, string?] = [data, unused, url];
        if (url) {
          handleRouteChange(url).then((shouldContinue) => {
            if (shouldContinue) {
              originalFn.apply(this, args);
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
  ]);

  // Handle interaction timeout
  useEffect(() => {
    if (isSuccess) return; // Disable timeout in success state

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
                description:
                  "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
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
  }, [
    lastInteractionTime,
    showWarning,
    currentStep,
    goToStep,
    resetStore,
    selectedSacrifice,
    formData.length,
    updateSacrifice,
    isSuccess,
  ]);

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
  }, [currentStep, TIMEOUT_DURATION]);

  // Sayfa kapatma/yenileme durumunda DB güncelleme
  useEffect(() => {
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

      // Beacon API ile güncelleme yap
      const updateData = {
        sacrifice_id: selectedSacrifice.sacrifice_id,
        form_count: formData.length,
      };

      const blob = new Blob([JSON.stringify(updateData)], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/update-sacrifice", blob);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
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
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleApprove = async () => {
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
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  return (
    <div className="container flex flex-col space-y-8">
      {!isSuccess ? (
        <>
          <Tabs
            value={tabValue}
            onValueChange={(value) => {
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
            }}
            className="w-full"
          >
            <ProgressBar currentStep={currentStep} />

            <TabsContent value="tab-1">
              <CustomDataTable
                data={data}
                columns={columns}
                meta={{
                  onSacrificeSelect: handleSacrificeSelect,
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
                        description:
                          "Kurbanlık bilgileri alınamadı. Lütfen tekrar deneyin.",
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

          {(currentStep === "details" || currentStep === "confirmation") && (
            <div className="text-sm text-muted-foreground text-center mt-auto mb-8">
              Kalan Süre: {timeLeft} saniye
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 space-y-16">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Icon */}
            <div className="rounded-full flex items-center justify-center">
              <i className="bi bi-patch-check-fill text-8xl text-sac-primary"></i>
            </div>
            <div>
              <h1 className="text-4xl text-center font-bold mb-4">Teşekkürler...</h1>
              <p className="text-muted-foreground text-center text-lg">
                Hisse kaydınız başarıyla oluşturulmuştur.
              </p>
              {/* Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <Button
                  className="flex items-center justify-center gap-2 bg-black hover:bg-black/90 text-white px-4 py-3 h-auto text-lg"
                  onClick={() => router.push('/hissesorgula')}
                >
                  <i className="bi bi-search text-xl"></i>
                  Hisse Sorgula
                </Button>
                <Button
                  className="flex items-center justify-center gap-2 bg-sac-primary hover:bg-sac-primary/90 text-white px-4 py-3 h-auto text-lg"
                >
                  <i className="bi bi-cloud-download text-xl"></i>
                  PDF İndir
                </Button>
              </div>
            </div>
          </div>

          <TripleInfo />
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

      <AlertDialog open={showWarning && !isSuccess} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogTitle>Uyarı</AlertDialogTitle>
          <AlertDialogDescription>
            {timeLeft} saniye içerisinde işlem yapmazsanız hisse seçim sayfasına
            yönlendirileceksiniz.
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Page;
