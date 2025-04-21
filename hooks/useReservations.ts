import { useToast } from "@/components/ui/use-toast";
import {
  GenericReservationMutation,
  ReservationData as ImportedReservationData,
  ReservationStatus,
  UpdateShareCountData,
  UpdateShareCountMutation,
  UpdateShareCountResponse
} from "@/types/reservation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Rezervasyon durumu için olası değerler (local use only)
export enum ReservationStatusLocal {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

// Rezervasyon verisi tanımı
export interface ReservationData {
  id: string;
  name: string;
  email: string;
  phone: string;
  tcno: string;
  status: ReservationStatusLocal;
  sacrifice_id: string;
  share_count: number;
  group_name?: string;
  created_at: string;
  updated_at: string;
}

// Rezervasyon yanıtı için tip tanımı
export interface ReservationResponse {
  success: boolean;
  message: string;
  data: ImportedReservationData[];
  error?: string;
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


      try {
        const response = await fetch(`/api/check-reservation-status?transaction_id=${transaction_id}`);

        if (!response.ok) {
          const errorData = await response.json();
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
interface CreateReservationData {
  transaction_id: string;
  sacrifice_id: string;
  share_count: number;
  status?: ReservationStatusLocal; // Opsiyonel status alanı
}

// Reservation_transactions tablosuna yeni kayıt eklemek için mutation hook
export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation<any, Error, CreateReservationData>({
    mutationFn: async ({
      transaction_id,
      sacrifice_id,
      share_count,
      status,
    }: CreateReservationData) => {

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
          throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
        }

        // Başarılı yanıt
        const responseData = await response.json();
        return responseData;
      } catch (error) {
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

      toast({
        title: "Başarılı",
        description: "Hisse rezervasyonu başarıyla oluşturuldu",
      });
    },

    // Mutation hata verdiğinde
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon işlemi sırasında bir sorun oluştu: ${error.message}`,
      });
    },
  });

  // Tip uyumluluğu için GenericReservationMutation'a uygun şekilde dönüştürüyoruz
  return {
    ...mutation,
    status: mutation.status || 'idle'
  } as GenericReservationMutation;
};

// Hisse adedini güncellemek için mutation hook
export const useUpdateShareCount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<UpdateShareCountResponse, Error, UpdateShareCountData>({
    mutationFn: async ({
      transaction_id,
      share_count,
      operation
    }: UpdateShareCountData) => {

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
        return responseData;
      } catch (error) {
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
  }) as UpdateShareCountMutation;
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
          throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
        }

        // Başarılı yanıt
        const responseData = await response.json();
        return responseData;
      } catch (error) {
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

      toast({
        title: "Başarılı",
        description: "Hisse rezervasyonu başarıyla iptal edildi",
      });
    },

    // Mutation hata verdiğinde
    onError: (error: Error) => {
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
        return responseData;
      } catch (error) {
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

    },

    // Mutation hata verdiğinde
    onError: (error: Error) => {

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
        return responseData;
      } catch (error) {
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
    },

    // On error, show a toast
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon tamamlanırken bir sorun oluştu: ${error.message}`,
      });
    },
  });
}; 