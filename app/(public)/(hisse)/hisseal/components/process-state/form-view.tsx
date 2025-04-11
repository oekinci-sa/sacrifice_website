import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { ShareFilters } from "../table-step/ShareFilters";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Checkout from "../shareholder-info-step/checkout";
import ShareholderSummary from "../confirmation-step/shareholder-summary";
import { sacrificeSchema } from "@/types";
import { supabase } from "@/utils/supabaseClient";
import ProgressBar from "../common/progress-bar";
import { useReservationStore } from "@/stores/useReservationStore";
import { useCancelReservation } from "@/hooks/useReservations";

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
  updateShareCount: any;
  setFormData: (data: any[]) => void;
  goToStep: (step: string) => void;
  resetStore: () => void;
  setLastInteractionTime: (time: number) => void;
  setTimeLeft: (time: number) => void;
  handleApprove: () => Promise<void>;
  toast: any;
  isLoading?: boolean;
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
  updateShareCount,
  setFormData,
  goToStep,
  resetStore,
  setLastInteractionTime,
  setTimeLeft,
  handleApprove,
  toast,
  isLoading = false
}: FormViewProps) => {
  const transaction_id = useReservationStore(state => state.transaction_id);
  const cancelReservation = useCancelReservation();

  return (
    <>
      <h1 className="text-xl sm:text-2xl font-bold text-center mb-0 sm:mb-2">Hisse Al</h1>
      <ProgressBar currentStep={currentStep} />

      {isLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p className="text-sm font-medium">İşleminiz yapılıyor...</p>
          </div>
        </div>
      )}

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
                await cancelReservation.mutateAsync({
                  transaction_id
                });

                resetStore();
                goToStep("selection");
              } catch (err) {
                console.error('Error handling back action:', err);
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