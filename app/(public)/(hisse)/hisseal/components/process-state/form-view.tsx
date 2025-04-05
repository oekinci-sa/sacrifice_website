import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { ShareFilters } from "../table-step/ShareFilters";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Checkout from "../shareholder-info-step/checkout";
import ShareholderSummary from "../confirmation-step/shareholder-summary";
import { sacrificeSchema } from "@/types";
import { supabase } from "@/utils/supabaseClient";
import ProgressBar from "../common/progress-bar";

interface FormViewProps {
  currentStep: string;
  tabValue: string;
  timeLeft: number;
  showWarning: boolean;
  columns: any[];
  data: any[];
  selectedSacrifice: sacrificeSchema | null;
  formData: any[];
  onSacrificeSelect: (sacrifice: sacrificeSchema) => void;
  updateSacrifice: any;
  setFormData: (data: any[]) => void;
  goToStep: (step: string) => void;
  resetStore: () => void;
  setLastInteractionTime: (time: number) => void;
  setTimeLeft: (time: number) => void;
  handleApprove: () => Promise<void>;
  toast: any;
}

export const FormView = ({
  currentStep,
  tabValue,
  timeLeft,
  showWarning,
  columns,
  data,
  selectedSacrifice,
  formData,
  onSacrificeSelect,
  updateSacrifice,
  setFormData,
  goToStep,
  resetStore,
  setLastInteractionTime,
  setTimeLeft,
  handleApprove,
  toast
}: FormViewProps) => {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-bold text-center mb-0 sm:mb-2">Hisse Al</h1>
      <ProgressBar currentStep={currentStep} />

      <Tabs value={tabValue} className="space-y-4 md:space-y-6">
        <TabsContent value="tab-1">
          <CustomDataTable
            data={data}
            columns={columns}
            searchKey="sacrifice_no"
            searchPlaceholder="Kurbanlık Numarası Ara..."
            meta={{
              onSacrificeSelect,
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

                // Güncel empty_share değerini kullanarak güncelleme yap
                await updateSacrifice.mutateAsync({
                  sacrificeId: selectedSacrifice.sacrifice_id,
                  emptyShare: currentSacrifice.empty_share + shareCount,
                });

                // Store'u sıfırla
                resetStore();
                // İlk adıma dön
                goToStep("selection");
              } catch (err) {
                console.error('Error handling back action:', err);
                toast({
                  variant: "destructive",
                  title: "Hata",
                  description: "İşlem sırasında bir hata oluştu.",
                });
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

      <AlertDialog open={showWarning} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogTitle>Uyarı</AlertDialogTitle>
          <AlertDialogDescription>
            {timeLeft} saniye içerisinde işlem yapmazsanız hisse seçim sayfasına
            yönlendirileceksiniz.
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 