import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

// Rezervasyon durumu için olası değerler
export enum ReservationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CANCELED = 'canceled',  // 'canceled' versiyonu da ekleyelim (tutarlılık için)
  TIMED_OUT = 'timed out', // Zaman aşımı durumu için yeni enum değeri
  EXPIRED = 'expired' // Expiration için enum değeri
}

// Reservation status check interface
export interface ReservationStatusData {
  status: ReservationStatus;
  transaction_id: string;
  timeRemaining: number | null; // seconds remaining
  expires_at: string | null;
  sacrifice_id: string;
  share_count: number;
}

// New hook for checking reservation status
export const useReservationStatus = (transaction_id: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Skip query if no transaction_id
  const enabled = !!transaction_id && transaction_id.length > 0;
  
  return useQuery<ReservationStatusData, Error>({
    queryKey: ['reservation-status', transaction_id],
    queryFn: async () => {
      if (!transaction_id) {
        throw new Error('Transaction ID is required');
      }
      
      console.log('Checking reservation status for transaction_id:', transaction_id);
      
      try {
        const response = await fetch(`/api/check-reservation-status?transaction_id=${transaction_id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error checking reservation status:', errorData);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const data = await response.json();
        return data as ReservationStatusData;
      } catch (error) {
        console.error('Error in reservation status check:', error);
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('An unexpected error occurred while checking reservation status');
        }
      }
    },
    enabled: enabled,
    refetchInterval: 30000, // Check every 30 seconds while window is open
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    retry: 3,
  });
};

// Rezervasyonu ekle hook'u tipini daha iyi tanımlayalım
interface ReservationData {
  transaction_id: string;
  sacrifice_id: string;
  share_count: number;
  status?: ReservationStatus; // Opsiyonel status alanı
}

// Reservation_transactions tablosuna yeni kayıt eklemek için mutation hook
export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, ReservationData>({
    mutationFn: async ({
      transaction_id,
      sacrifice_id,
      share_count,
      status = ReservationStatus.ACTIVE, // Varsayılan değer ACTIVE
    }: ReservationData) => {
      console.log('Creating reservation with:', { transaction_id, sacrifice_id, share_count, status });
      
      try {
        // Yeni API endpoint'imizi kullanarak server-side işlemi gerçekleştir
        const response = await fetch('/api/create-reservation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transaction_id, sacrifice_id, share_count, status })
        });

        // Başarısız yanıt durumunda
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Reservation API error:', errorData);
          throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
        }

        // Başarılı yanıt
        const responseData = await response.json();
        console.log('Reservation created successfully:', responseData);
        return responseData;
      } catch (error) {
        console.error('Reservation creation error:', error);
        // Network hatası veya diğer beklenmeyen hatalar
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Rezervasyon oluşturulurken beklenmeyen bir hata oluştu');
        }
      }
    },
    
    // Mutation başarılı olduğunda
    onSuccess: (data) => {
      // Kurbanlıklar verisini yenile (cache güncelleme)
      queryClient.invalidateQueries({ queryKey: ["sacrifices"] });
      
      console.log('Reservation mutation completed successfully', data);
      
      toast({
        title: "Başarılı",
        description: "Hisse rezervasyonu başarıyla oluşturuldu",
      });
    },
    
    // Mutation hata verdiğinde
    onError: (error: Error) => {
      console.error('Reservation mutation error:', error);
      
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon işlemi sırasında bir sorun oluştu: ${error.message}`,
      });
    },
  });
};

// Hisse adedini güncellemek için yeni mutation
interface UpdateShareCountData {
  transaction_id: string;
  share_count: number;
  operation: 'add' | 'remove'; // İşlem tipini belirtmek için
}

// Hisse adedini güncellemek için mutation hook
export const useUpdateShareCount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, UpdateShareCountData>({
    mutationFn: async ({
      transaction_id,
      share_count,
      operation
    }: UpdateShareCountData) => {
      console.log('Updating share count:', { transaction_id, share_count, operation });
      
      try {
        // Server-side API endpoint'i kullan
        const response = await fetch('/api/update-share-count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transaction_id, share_count, operation })
        });

        // Başarısız yanıt durumunda
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Update share count API error:', errorData);
          throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
        }

        // Başarılı yanıt
        const responseData = await response.json();
        console.log('Share count updated successfully:', responseData);
        return responseData;
      } catch (error) {
        console.error('Share count update error:', error);
        // Network hatası veya diğer beklenmeyen hatalar
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Hisse adedi güncellenirken beklenmeyen bir hata oluştu');
        }
      }
    },
    
    // Mutation başarılı olduğunda
    onSuccess: (data) => {
      // Kurbanlıklar verisini yenile (cache güncelleme)
      queryClient.invalidateQueries({ queryKey: ["sacrifices"] });
      
      console.log('Share count update completed successfully', data);
    },
    
    // Mutation hata verdiğinde
    onError: (error: Error) => {
      console.error('Share count update error:', error);
      
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Hisse adedi güncellenirken bir sorun oluştu: ${error.message}`,
      });
    },
  });
};

// Yeni eklenen hook: Rezervasyonu iptal etmek için
interface CancelReservationData {
  transaction_id: string;
}

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, CancelReservationData>({
    mutationFn: async ({ transaction_id }: CancelReservationData) => {
      console.log('Canceling reservation with transaction_id:', transaction_id);
      
      if (!transaction_id) {
        throw new Error("İşlem kimliği (transaction_id) eksik");
      }
      
      try {
        // Server-side API endpoint'i kullan
        const response = await fetch('/api/cancel-reservation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transaction_id })
        });

        // Başarısız yanıt durumunda
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Cancel reservation API error:', errorData);
          throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
        }

        // Başarılı yanıt
        const responseData = await response.json();
        console.log('Reservation canceled successfully:', responseData);
        return responseData;
      } catch (error) {
        console.error('Reservation cancellation error:', error);
        // Network hatası veya diğer beklenmeyen hatalar
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Rezervasyon iptal edilirken beklenmeyen bir hata oluştu');
        }
      }
    },
    
    // Mutation başarılı olduğunda
    onSuccess: (data, variables) => {
      // Rezervasyon ve kurbanlık verilerini yenile (cache güncelleme)
      queryClient.invalidateQueries({ queryKey: ["sacrifices"] });
      queryClient.invalidateQueries({ queryKey: ["reservation", variables.transaction_id] });
      
      console.log('Reservation cancellation completed successfully', data);
      
      toast({
        title: "Başarılı",
        description: "Hisse rezervasyonu başarıyla iptal edildi",
      });
    },
    
    // Mutation hata verdiğinde
    onError: (error: Error) => {
      console.error('Reservation cancellation error:', error);
      
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon iptal edilirken bir sorun oluştu: ${error.message}`,
      });
    },
  });
};

// Yeni eklenen hook: Rezervasyonu zaman aşımına uğratmak için
interface TimeoutReservationData {
  transaction_id: string;
}

export const useTimeoutReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, TimeoutReservationData>({
    mutationFn: async ({ transaction_id }: TimeoutReservationData) => {
      console.log('Timing out reservation with transaction_id:', transaction_id);

      if (!transaction_id) {
        throw new Error("İşlem kimliği (transaction_id) eksik");
      }

      try {
        // Server-side API endpoint'i kullan
        const response = await fetch('/api/timeout-reservation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transaction_id })
        });

        // Başarısız yanıt durumunda
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Timeout reservation API error:', errorData);
          throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
        }

        // Başarılı yanıt
        const responseData = await response.json();
        console.log('Reservation timed out successfully:', responseData);
        return responseData;
      } catch (error) {
        console.error('Reservation timeout error:', error);
        // Network hatası veya diğer beklenmeyen hatalar
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Rezervasyon zaman aşımına uğratılırken beklenmeyen bir hata oluştu');
        }
      }
    },

    // Mutation başarılı olduğunda
    onSuccess: (data, variables) => {
      // Rezervasyon ve kurbanlık verilerini yenile (cache güncelleme)
      queryClient.invalidateQueries({ queryKey: ["sacrifices"] });
      queryClient.invalidateQueries({ queryKey: ["reservation", variables.transaction_id] });

      console.log('Reservation timeout completed successfully', data);
    },

    // Mutation hata verdiğinde
    onError: (error: Error) => {
      console.error('Reservation timeout error:', error);

      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon zaman aşımına uğratılırken bir sorun oluştu: ${error.message}`,
      });
    },
  });
};

// Hook for completing a reservation
interface CompleteReservationData {
  transaction_id: string;
}

export const useCompleteReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, CompleteReservationData>({
    mutationFn: async ({ transaction_id }: CompleteReservationData) => {
      console.log('Completing reservation with transaction_id:', transaction_id);

      if (!transaction_id) {
        throw new Error("İşlem kimliği (transaction_id) eksik");
      }

      try {
        // Call the API endpoint
        const response = await fetch('/api/complete-reservation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transaction_id })
        });

        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Complete reservation API error:', errorData);
          throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
        }

        // Handle successful response
        const responseData = await response.json();
        console.log('Reservation completed successfully via API:', responseData);
        return responseData;
      } catch (error) {
        console.error('Reservation completion error:', error);
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Rezervasyon tamamlanırken beklenmeyen bir hata oluştu');
        }
      }
    },

    // On success, invalidate relevant queries
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reservation", variables.transaction_id] });
      // Optionally invalidate other related queries if needed
      console.log('Reservation completion mutation successful', data);
    },

    // On error, show a toast
    onError: (error: Error) => {
      console.error('Reservation completion mutation error:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon tamamlanırken bir sorun oluştu: ${error.message}`,
      });
    },
  });
}; 