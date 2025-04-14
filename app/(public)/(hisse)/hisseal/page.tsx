"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  handleApprove as helperHandleApprove,
  handleShareCountSelect as helperHandleShareCountSelect,
  useHandleInteractionTimeout,
  useHandleNavigationHistory,
  useHandlePageUnload,
  useTrackInteractions
} from "@/helpers/hisseal-helpers";
import { ReservationStatus, useCreateReservation, useReservationStatus, useUpdateShareCount } from "@/hooks/useReservations";
import {
  useSacrifices,
} from "@/hooks/useSacrifices";
import { useCreateShareholders } from "@/hooks/useShareholders";
import { useHisseStore } from "@/stores/useHisseStore";
import { useReservationStore } from "@/stores/useReservationStore";
import { sacrificeSchema } from "@/types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FormView } from "./components/process-state/form-view";
import { SuccessView } from "./components/success-state/success-view";
import { columns } from "./components/table-step/columns";
import { ShareSelectDialog } from "./components/table-step/share-select-dialog";
import { ReservationInfoDialog } from "./components/reservation-info-dialog";

const TIMEOUT_DURATION = 15; // 3 minutes
const WARNING_THRESHOLD = 5; // Show warning at 1 minute

const Page = () => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_DURATION);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [isReservationLoading, setIsReservationLoading] = useState(false);
  const [showReservationInfo, setShowReservationInfo] = useState(false);
  
  // Expiration warning states
  const [showThreeMinuteWarning, setShowThreeMinuteWarning] = useState(false);
  const [showOneMinuteWarning, setShowOneMinuteWarning] = useState(false);
  
  // Zustand stores
  const {
    selectedSacrifice,
    tempSelectedSacrifice,
    formData,
    currentStep,
    tabValue,
    isSuccess,
    hasNavigatedAway,
    sacrifices,
    isLoadingSacrifices,
    setSelectedSacrifice,
    setTempSelectedSacrifice,
    setFormData,
    goToStep,
    resetStore,
    setSuccess,
    setHasNavigatedAway,
  } = useHisseStore();
  
  // Reservation store - transaction_id yönetimi
  const { transaction_id, generateNewTransactionId } = useReservationStore();

  // React Query hooks
  const { data, isLoading: isQueryLoading } = useSacrifices();
  const updateShareCount = useUpdateShareCount();
  const createShareholders = useCreateShareholders();
  const createReservation = useCreateReservation();
  
  // Reservation status hook (only active in details and confirmation steps)
  const shouldCheckStatus = currentStep === "details" || currentStep === "confirmation";
  const { 
    data: reservationStatus, 
    isLoading: isStatusLoading,
    error: statusError,
    refetch: refetchStatus
  } = useReservationStatus(shouldCheckStatus ? transaction_id : '');

  // Combined loading state from both sources
  const isLoading = isQueryLoading || isLoadingSacrifices || isStatusLoading;

  // Handle reservation status changes
  useEffect(() => {
    if (!reservationStatus || !shouldCheckStatus) return;
    
    console.log('Reservation status updated:', reservationStatus);
    
    // If status is expired, redirect to selection step
    if (reservationStatus.status === ReservationStatus.EXPIRED) {
      toast({
        variant: "destructive",
        title: "Rezervasyon Süresi Doldu",
        description: "Rezervasyon süresi dolduğu için hisse seçim sayfasına yönlendiriliyorsunuz."
      });
      
      // Reset store and redirect
      resetStore();
      goToStep("selection");
      return;
    }
    
    // Update expiration countdown if we have timeRemaining
    if (reservationStatus.timeRemaining !== null) {
      const remainingSeconds = reservationStatus.timeRemaining;
      
      // Show warning at 3 minutes remaining
      if (remainingSeconds <= 180 && remainingSeconds > 60 && !showThreeMinuteWarning) {
        setShowThreeMinuteWarning(true);
      }
      
      // Show warning at 1 minute remaining
      if (remainingSeconds <= 60 && !showOneMinuteWarning) {
        setShowOneMinuteWarning(true);
      }
    }
  }, [reservationStatus, shouldCheckStatus, resetStore, goToStep, toast, showThreeMinuteWarning, showOneMinuteWarning]);

  // Rezervasyon işlemi sırasında yükleniyor durumunu yönet
  useEffect(() => {
    // En basit ve güvenli kontrole dönelim - any type kullanarak
    try {
      // @ts-ignore - React Query'nin versiyona göre değişen yapısını ele almak için
      const isLoading = createReservation.isPending || createReservation.isLoading || createReservation.isFetching || false;
      if (isLoading) {
        setIsReservationLoading(true);
      } else {
        // Kısa bir gecikme ile yükleniyor durumunu kaldır (UI geçişi için)
        const timer = setTimeout(() => setIsReservationLoading(false), 300);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      // Herhangi bir hata durumunda, yükleme durumunu kapat
      console.warn('React Query yükleme durumu kontrol edilemedi:', error);
      setIsReservationLoading(false);
    }
  }, [createReservation]);

  // Check if we need to reset the success state due to navigation
  useEffect(() => {
    if (hasNavigatedAway && isSuccess) {
      console.log('Resetting success state due to previous navigation');
      resetStore();
      setSuccess(false);
      setHasNavigatedAway(false);
    }
  }, [hasNavigatedAway, isSuccess, resetStore, setSuccess, setHasNavigatedAway]);

  // Reset form state when entering the page
  useEffect(() => {
    if (pathname === "/hisseal" && !isSuccess) {
      resetStore();
      goToStep("selection");
      // Yeni bir transaction_id oluştur
      generateNewTransactionId();
      
      // Reset warning states
      setShowThreeMinuteWarning(false);
      setShowOneMinuteWarning(false);
      
      // Console'a transaction_id değerini ve uzunluğunu logla (debug için)
      console.log('Generated new transaction_id:', {
        id: useReservationStore.getState().transaction_id,
        length: useReservationStore.getState().transaction_id.length
      });
    }
  }, [pathname, resetStore, goToStep, generateNewTransactionId, isSuccess]);

  // Set navigation flag when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (isSuccess) {
        console.log('Component unmounting, setting navigated away flag');
        setHasNavigatedAway(true);
      }
    };
  }, [isSuccess, setHasNavigatedAway]);

  // Add beforeunload listener to handle page refreshes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isSuccess) {
        console.log('Page refresh/close detected, setting navigated away flag');
        setHasNavigatedAway(true);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSuccess, setHasNavigatedAway]);

  // Handle navigation changes
  useHandleNavigationHistory({
    currentStep,
    selectedSacrifice,
    formData,
    updateShareCount,
    resetStore,
    goToStep,
    isSuccess,
    setHasNavigatedAway,
    toast
  });

  // Handle interaction timeout
  useHandleInteractionTimeout(
    isSuccess,
    currentStep,
    selectedSacrifice,
    formData,
    updateShareCount,
    goToStep,
    resetStore,
    lastInteractionTime,
    showWarning,
    setShowWarning,
    setTimeLeft,
    TIMEOUT_DURATION,
    WARNING_THRESHOLD
  );

  // Sayfa seviyesinde etkileşimleri takip et
  useTrackInteractions(
    currentStep,
    setLastInteractionTime,
    setShowWarning,
    setTimeLeft,
    TIMEOUT_DURATION
  );

  // Sayfa kapatma/yenileme durumunda DB güncelleme
  useHandlePageUnload({
    currentStep,
    selectedSacrifice,
    formData,
    isSuccess
  });

  // Handler for dismissing expiration warnings
  const handleDismissWarning = useCallback((warningType: 'three-minute' | 'one-minute') => {
    if (warningType === 'three-minute') {
      setShowThreeMinuteWarning(false);
    } else {
      setShowOneMinuteWarning(false);
    }
  }, []);

  const handleSacrificeSelect = async (sacrifice: sacrificeSchema) => {
    setTempSelectedSacrifice(sacrifice);
    setIsDialogOpen(true);
  };

  const handleShareCountSelect = async (shareCount: number) => {
    setIsReservationLoading(true);
    try {
      await helperHandleShareCountSelect({
        shareCount,
        tempSelectedSacrifice,
        updateShareCount,
        setSelectedSacrifice,
        setFormData,
        goToStep,
        setIsDialogOpen,
        setLastInteractionTime,
        toast,
        transaction_id,
        createReservation
      });
      
      // Direkt olarak details adımına geç
      goToStep("details");
      
      // Details adımına geçtikten SONRA bilgi diyaloğunu göster
      setTimeout(() => {
        setShowReservationInfo(true);
      }, 300);
      
    } catch (error) {
      console.error('Error in handleShareCountSelect:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
      });
    } finally {
      // Hata olsa bile yükleniyor durumunu kaldır
      setTimeout(() => setIsReservationLoading(false), 300);
    }
  };
  
  // Handle the continuation after reservation info dialog is closed
  const handleReservationInfoClose = () => {
    setShowReservationInfo(false);
    // Artık ilerleme gerekmiyor çünkü zaten details adımındayız
  };

  const handleApprove = async () => {
    await helperHandleApprove({
      selectedSacrifice,
      formData,
      createShareholders,
      setSuccess,
      goToStep,
      toast
    });
  };

  const handlePdfDownload = () => {
    // PDF indirme işlemi buraya eklenecek
    console.log("PDF indirme işlemi");
  };

  // Prefer Zustand store data, but fall back to React Query data if needed
  const sacrificeData = sacrifices.length > 0 ? sacrifices : data || [];

  // Calculate remaining minutes for display in warnings
  const getRemainingMinutesText = () => {
    if (!reservationStatus || !reservationStatus.timeRemaining) return '';
    
    const minutes = Math.ceil(reservationStatus.timeRemaining / 60);
    return `${minutes} dakika`;
  };

  return (
    <div className="container flex flex-col space-y-8">
      {isSuccess ? (
        <SuccessView onPdfDownload={handlePdfDownload} />
      ) : (
        <FormView
          currentStep={currentStep}
          tabValue={tabValue}
          timeLeft={timeLeft}
          showWarning={showWarning}
          columns={columns}
          data={sacrificeData}
          selectedSacrifice={selectedSacrifice}
          formData={formData}
          onSacrificeSelect={handleSacrificeSelect}
          updateShareCount={updateShareCount}
          setFormData={setFormData}
          goToStep={goToStep}
          resetStore={resetStore}
          setLastInteractionTime={setLastInteractionTime}
          setTimeLeft={setTimeLeft}
          handleApprove={handleApprove}
          toast={toast}
          isLoading={isLoading || isReservationLoading}
          serverTimeRemaining={reservationStatus?.timeRemaining}
        />
      )}

      {/* Dialog for selecting share count */}
      {tempSelectedSacrifice && (
        <ShareSelectDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          sacrifice={tempSelectedSacrifice}
          onSelect={handleShareCountSelect}
          isLoading={isReservationLoading}
        />
      )}
      
      {/* Reservation Info Dialog - shown after share selection */}
      <ReservationInfoDialog
        isOpen={showReservationInfo}
        onClose={handleReservationInfoClose}
      />
      
      {/* 3-Minute warning dialog */}
      <AlertDialog open={showThreeMinuteWarning} onOpenChange={() => setShowThreeMinuteWarning(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rezervasyon Süresi Uyarısı</AlertDialogTitle>
            <AlertDialogDescription>
              Hisse rezervasyon sürenizin dolmasına yaklaşık {getRemainingMinutesText()} kaldı. 
              Lütfen işleminizi tamamlayınız, aksi takdirde rezervasyonunuz iptal edilecek ve 
              hisse seçim sayfasına yönlendirileceksiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => handleDismissWarning('three-minute')}>
              Anladım
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 1-Minute warning dialog */}
      <AlertDialog open={showOneMinuteWarning} onOpenChange={() => setShowOneMinuteWarning(false)}>
        <AlertDialogContent className="bg-red-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Son Uyarı: Rezervasyon Süresi Doluyor!</AlertDialogTitle>
            <AlertDialogDescription className="text-red-600">
              Hisse rezervasyon sürenizin dolmasına yalnızca {getRemainingMinutesText()} kaldı. 
              Lütfen işleminizi hemen tamamlayınız, aksi takdirde rezervasyonunuz iptal edilecek 
              ve tüm bilgileriniz silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => handleDismissWarning('one-minute')} className="bg-red-600 hover:bg-red-700">
              Acilen Tamamla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Page;
