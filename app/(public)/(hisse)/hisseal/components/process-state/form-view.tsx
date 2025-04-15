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
import { useCancelReservation, useReservationStatus } from "@/hooks/useReservations";
import { useEffect, useState } from "react";
import CountdownTimer from '../common/countdown-timer';

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
  serverTimeRemaining?: number | null; // Server-based remaining time
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
  isLoading = false,
  serverTimeRemaining = null
}: FormViewProps) => {
  const transaction_id = useReservationStore(state => state.transaction_id);
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
  
  // Format remaining time for display in HH:MM:SS format
  const formatRemainingTime = () => {
    // Always use local time for display
    const secondsRemaining = localTimeRemaining;
    
    if (secondsRemaining <= 0) return "00:00:00";
    
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = secondsRemaining % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
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
    <>
      <h1 className="text-xl md:text-2xl lg:text-4xl font-bold mb-4 text-center mt-8">Hisse Al</h1>
      <ProgressBar currentStep={currentStep} />
      
      {/* Süre göstergesi - formun üst kısmında gösteriliyor */}
      {(currentStep === "details" || currentStep === "confirmation") && (
        <CountdownTimer
          expirationTime={formatExpirationTime()}
          remainingTime={localTimeRemaining}
        />
      )}

      {/* Non-blocking loading indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg flex items-center z-40">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sac-primary mr-2"></div>
          <p className="text-sm font-medium text-sac-primary">Yükleniyor...</p>
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
            pageSizeOptions={[20, 50, 100, 150]}
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
            remainingTime={localTimeRemaining}
            setRemainingTime={setTimeLeft}
          />
        </TabsContent>
      </Tabs>

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