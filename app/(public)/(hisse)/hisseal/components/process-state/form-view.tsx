import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast as ToastType } from "@/components/ui/use-toast";
import { useCancelReservation, useReservationStatus } from "@/hooks/useReservations";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { sacrificeSchema } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
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
  delivery_location: string;
  delivery_fee: number;
  sacrifice_consent: boolean;
  is_purchaser?: boolean;
  paid_amount?: number;
}

interface FormViewProps {
  currentStep: Step;
  tabValue: string;
  timeLeft: number;
  showWarning: boolean;
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
  setTimeLeft: (value: number | ((prevValue: number) => number)) => void;
  handleApprove: () => Promise<void>;
  toast: (props: Parameters<typeof ToastType>[0]) => void;
  isLoading?: boolean;
  serverTimeRemaining?: number | null;
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
  goToStep,
  resetStore,
  setLastInteractionTime,
  setTimeLeft,
  handleApprove,
  serverTimeRemaining = null
}: FormViewProps) => {
  const transaction_id = useReservationIDStore(state => state.transaction_id);
  const cancelReservation = useCancelReservation();
  const [localTimeRemaining, setLocalTimeRemaining] = useState(serverTimeRemaining ?? timeLeft);

  // Check reservation status directly in component if needed
  const shouldCheckStatus = currentStep === "details" || currentStep === "confirmation";
  const { data: reservationStatus } = useReservationStatus(
    shouldCheckStatus ? transaction_id : ''
  );

  // Update local time when server time changes
  useEffect(() => {
    if (reservationStatus?.timeRemaining !== undefined && reservationStatus?.timeRemaining !== null) {
      setLocalTimeRemaining(reservationStatus.timeRemaining);
    }
  }, [reservationStatus?.timeRemaining]);

  // Canlı geri sayım için timer
  useEffect(() => {
    if (!shouldCheckStatus) return;

    const timer = setInterval(() => {
      setLocalTimeRemaining(prevTime => {
        if (prevTime <= 0) return 0;
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [shouldCheckStatus]);

  // Format expiration time
  const formatExpirationTime = () => {
    if (!reservationStatus?.expires_at) return "";

    const expiryDate = new Date(reservationStatus.expires_at);
    return expiryDate.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <h1 className="text-3xl md:text-4xl font-bold mt-8 text-center">Hisse Al</h1>
      <ProgressBar currentStep={currentStep as Step} />

      {/* Süre göstergesi - formun üst kısmında gösteriliyor */}
      {(currentStep === "details" || currentStep === "confirmation") && (
        <CountdownTimer
          expirationTime={formatExpirationTime()}
          remainingTime={localTimeRemaining}
        />
      )}

      {/* Tablar */}
      <Tabs value={tabValue} className="space-y-4 md:space-y-6">
        {/* Tab 1 - Hisse Seçimi */}
        <TabsContent value="tab-1">
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

              try {
                cancelReservation.mutateAsync({
                  transaction_id
                }).then(() => {
                  resetStore();
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
            remainingTime={localTimeRemaining}
            setRemainingTime={setTimeLeft}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={showWarning} onOpenChange={() => { }}>
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