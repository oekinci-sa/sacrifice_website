import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast as ToastType } from "@/components/ui/use-toast";
import { useCancelReservation } from "@/hooks/useReservations";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { sacrificeSchema } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import CountdownTimer from '../common/countdown-timer';
import ProgressBar from "../common/progress-bar";
import ShareholderSummary from "../confirmation-step/shareholder-summary";
import Checkout from "../shareholder-info-step/checkout";
import { ShareFilters } from "../table-step/ShareFilters";

export type Step = "selection" | "details" | "confirmation" | "success";

// Define a shareholder type for the form data
interface ShareholderFormData {
  name: string;
  phone: string;
  email?: string;
  delivery_location: string;
  second_phone?: string;
  delivery_fee: number;
  sacrifice_consent: boolean;
  is_purchaser?: boolean;
  paid_amount?: number;
}

interface FormViewProps {
  currentStep: Step;
  tabValue: string;
  timeLeft: number;
  columns: ColumnDef<sacrificeSchema>[];
  data: sacrificeSchema[];
  selectedSacrifice: sacrificeSchema | null;
  formData: ShareholderFormData[];
  onSacrificeSelect: (sacrifice: sacrificeSchema) => void;
  updateShareCount?: (shareCount: number) => void;
  setFormData?: (data: ShareholderFormData[]) => void;
  goToStep: (step: Step) => void;
  resetStore: () => void;
  setLastInteractionTime: (time: number) => void;
  handleApprove: () => Promise<void>;
  toast: (props: Parameters<typeof ToastType>[0]) => void;
  isLoading?: boolean;
}

export const FormView = ({
  currentStep,
  tabValue,
  timeLeft,
  columns,
  data,
  selectedSacrifice,
  formData,
  onSacrificeSelect,
  goToStep,
  resetStore,
  setLastInteractionTime,
  handleApprove,
}: FormViewProps) => {
  const transaction_id = useReservationIDStore(state => state.transaction_id);
  const generateNewTransactionId = useReservationIDStore(state => state.generateNewTransactionId);
  const cancelReservation = useCancelReservation();

  // Derive expiration clock time from timeLeft — no separate polling needed.
  // usePageInitialization already polls reservation status; duplicating it here
  // caused excessive /api/check-reservation-status requests.
  const expirationTime = useMemo(() => {
    if (timeLeft <= 0) return "";
    const expiryDate = new Date(Date.now() + timeLeft * 1000);
    return expiryDate.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [timeLeft]);

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <h1 className="text-3xl md:text-4xl font-bold mt-8 text-center">Hisse Al</h1>
      <ProgressBar currentStep={currentStep as Step} />

      {/* Süre göstergesi - formun üst kısmında gösteriliyor */}
      {(currentStep === "details" || currentStep === "confirmation") && (
        <CountdownTimer
          expirationTime={expirationTime}
          remainingTime={timeLeft}
        />
      )}

      {/* Tablar */}
      <Tabs value={tabValue} className="space-y-4 md:space-y-6">
        {/* Tab 1 - Hisse Seçimi */}
        <TabsContent value="tab-1" className="space-y-4">
          <CustomDataTable
            data={data || []}
            columns={columns}
            meta={{
              onSacrificeSelect,
            }}
            pageSizeOptions={[20, 50, 100, 150]}
            filters={({ table, columnFilters, onColumnFiltersChange }) => (
              <ShareFilters
                table={table}
                columnFilters={columnFilters}
                onColumnFiltersChange={onColumnFiltersChange}
              />
            )}
            tableSize="large"
          />
        </TabsContent>

        {/* Tab 2 - Ödeme Bilgileri */}
        <TabsContent value="tab-2">
          <Checkout
            onBack={(_shareCount) => {
              if (!selectedSacrifice) return;
              // CRITICAL: resetStore + generateNewTransactionId must ALWAYS be called
              // together before navigating back to selection. Without generateNewTransactionId
              // the next reservation reuses the old transaction_id and the 15-min timer
              // resumes from the previous session's remaining time.
              try {
                cancelReservation.mutateAsync({
                  transaction_id
                }).then(() => {
                  resetStore();
                  generateNewTransactionId();
                  goToStep("selection");
                }).catch(() => {
                });
              } catch {
              }
            }}
            setLastInteractionTime={setLastInteractionTime}
            onApprove={() => goToStep("confirmation")}
          />
        </TabsContent>

        {/* Tab 3 - Ödeme Onayı */}
        <TabsContent value="tab-3" className="space-y-8">
          <ShareholderSummary
            sacrifice={selectedSacrifice}
            shareholders={formData}
            onApprove={handleApprove}
            setCurrentStep={goToStep}
            remainingTime={timeLeft}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 