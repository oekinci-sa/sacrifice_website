import { useToast } from "@/components/ui/use-toast";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import {
  GenericReservationMutation,
  ReservationData as ImportedReservationData,
  ReservationStatus,
  UpdateShareCountData,
  UpdateShareCountResponse
} from "@/types/reservation";
import { useEffect, useState } from "react";

// Reservation status enum (local use only)
export enum ReservationStatusLocal {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

// Reservation data definition
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

// Reservation response type definition
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

// New hook for checking reservation status using Zustand
export const useReservationStatus = (transaction_id: string) => {
  const [data, setData] = useState<ReservationStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!transaction_id || transaction_id.length === 0) {
      setData(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const signal = controller.signal;

    const checkStatus = async () => {
      if (!isMounted) return;
      setIsLoading(true);

      try {
        const response = await fetch(`/api/check-reservation-status?transaction_id=${transaction_id}`, { signal });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();

        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;

        if (isMounted) {
          setError(error instanceof Error ? error : new Error(String(error)));
          setIsLoading(false);
        }
      }
    };

    // Check immediately
    checkStatus();

    // Periodic check - every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [transaction_id]);

  return { data, isLoading, error };
};

// Reservation data interface
interface CreateReservationData {
  transaction_id: string;
  sacrifice_id: string;
  share_count: number;
  status?: ReservationStatusLocal; // Optional status field
}

// Create reservation hook using Zustand
export const useCreateReservation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { refetchSacrifices } = useSacrificeStore();

  const mutate = async ({
    transaction_id,
    sacrifice_id,
    share_count,
    status,
  }: CreateReservationData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use server-side API endpoint
      const response = await fetch('/api/create-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id, sacrifice_id, share_count, status })
      });

      // Handle error response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Successful response
      const responseData = await response.json();

      // Refresh sacrifices data to get updated counts
      await refetchSacrifices();

      toast({
        title: "Başarılı",
        description: "Hisse rezervasyonu başarıyla oluşturuldu",
      });

      setIsLoading(false);
      return responseData;
    } catch (error) {
      // Network or other unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';

      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon işlemi sırasında bir sorun oluştu: ${errorMessage}`,
      });

      setError(error instanceof Error ? error : new Error(errorMessage));
      setIsLoading(false);
      throw error;
    }
  };

  // Ensure type compatibility with GenericReservationMutation
  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    error,
    isPending: isLoading,
    status: isLoading ? 'loading' : error ? 'error' : 'idle'
  } as unknown as GenericReservationMutation;
};

// Update share count hook using Zustand
export const useUpdateShareCount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { refetchSacrifices } = useSacrificeStore();

  const mutate = async ({
    transaction_id,
    share_count,
    operation
  }: UpdateShareCountData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use server-side API endpoint
      const response = await fetch('/api/update-share-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id, share_count, operation })
      });

      // Handle error response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Successful response
      const responseData = await response.json();

      // Refresh sacrifices data to get updated counts
      await refetchSacrifices();

      setIsLoading(false);
      return responseData as UpdateShareCountResponse;
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';

      toast({
        variant: "destructive",
        title: "Hata",
        description: `Hisse adedini güncellerken bir sorun oluştu: ${errorMessage}`,
      });

      setError(error instanceof Error ? error : new Error(errorMessage));
      setIsLoading(false);
      throw error;
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    error,
    isPending: isLoading,
    status: isLoading ? 'loading' : error ? 'error' : 'idle'
  } as unknown as GenericReservationMutation;
};

// Yeni eklenen hook: Rezervasyonu iptal etmek için
interface CancelReservationData {
  transaction_id: string;
}

export const useCancelReservation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { refetchSacrifices } = useSacrificeStore();

  const mutate = async ({ transaction_id }: CancelReservationData) => {
    if (!transaction_id) {
      throw new Error("İşlem kimliği (transaction_id) eksik");
    }

    setIsLoading(true);
    setError(null);

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

      // Refresh sacrifices data
      await refetchSacrifices();

      toast({
        title: "Başarılı",
        description: "Hisse rezervasyonu başarıyla iptal edildi",
      });

      setIsLoading(false);
      return responseData;
    } catch (error) {
      // Network hatası veya diğer beklenmeyen hatalar
      const errorMessage = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";

      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon iptal edilirken bir sorun oluştu: ${errorMessage}`,
      });

      setError(error instanceof Error ? error : new Error(errorMessage));
      setIsLoading(false);
      throw error;
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    error,
    isPending: isLoading,
    status: isLoading ? 'loading' : error ? 'error' : 'idle'
  } as unknown as GenericReservationMutation;
};

// Yeni eklenen hook: Rezervasyonu zaman aşımına uğratmak için
interface TimeoutReservationData {
  transaction_id: string;
}

export const useTimeoutReservation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { refetchSacrifices } = useSacrificeStore();

  const mutate = async ({ transaction_id }: TimeoutReservationData) => {
    if (!transaction_id) {
      throw new Error("İşlem kimliği (transaction_id) eksik");
    }

    setIsLoading(true);
    setError(null);

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
        throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
      }

      // Başarılı yanıt
      const responseData = await response.json();

      // Refresh sacrifices data
      await refetchSacrifices();

      setIsLoading(false);
      return responseData;
    } catch (error) {
      // Network hatası veya diğer beklenmeyen hatalar
      const errorMessage = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";

      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon zaman aşımına uğratılırken bir sorun oluştu: ${errorMessage}`,
      });

      setError(error instanceof Error ? error : new Error(errorMessage));
      setIsLoading(false);
      throw error;
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    error,
    isPending: isLoading,
    status: isLoading ? 'loading' : error ? 'error' : 'idle'
  } as unknown as GenericReservationMutation;
};

// Hook for completing a reservation
interface CompleteReservationData {
  transaction_id: string;
}

export const useCompleteReservation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const mutate = async ({ transaction_id }: CompleteReservationData) => {
    if (!transaction_id) {
      throw new Error("İşlem kimliği (transaction_id) eksik");
    }

    setIsLoading(true);
    setError(null);

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
        throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
      }

      // Handle successful response
      const responseData = await response.json();

      setIsLoading(false);
      return responseData;
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";

      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon tamamlanırken bir sorun oluştu: ${errorMessage}`,
      });

      setError(error instanceof Error ? error : new Error(errorMessage));
      setIsLoading(false);
      throw error;
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    error,
    isPending: isLoading,
    status: isLoading ? 'loading' : error ? 'error' : 'idle'
  } as unknown as GenericReservationMutation;
}; 