import { useToast } from "@/components/ui/use-toast";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { GenericReservationMutation } from "@/types/reservation";
import { useState } from "react";
import { ReservationStatusLocal } from "./types";

interface CreateReservationData {
  transaction_id: string;
  sacrifice_id: string;
  share_count: number;
  status?: ReservationStatusLocal;
}

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
      const response = await fetch("/api/create-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id, sacrifice_id, share_count, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const responseData = await response.json();
      await refetchSacrifices();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("reservation-updated"));
      }

      toast({
        title: "Başarılı",
        description: "Hisse rezervasyonu başarıyla oluşturuldu",
      });

      setIsLoading(false);
      return responseData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu";

      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon işlemi sırasında bir sorun oluştu: ${errorMessage}`,
      });

      setError(err instanceof Error ? err : new Error(errorMessage));
      setIsLoading(false);
      throw err;
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    error,
    isPending: isLoading,
    status: isLoading ? "loading" : error ? "error" : "idle",
  } as unknown as GenericReservationMutation;
};
