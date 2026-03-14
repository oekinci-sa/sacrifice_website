import { useToast } from "@/components/ui/use-toast";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { GenericReservationMutation } from "@/types/reservation";
import { useState } from "react";

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
      const response = await fetch("/api/timeout-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
      }

      const responseData = await response.json();
      await refetchSacrifices();

      setIsLoading(false);
      return responseData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu";

      toast({
        variant: "destructive",
        title: "Hata",
        description: `Rezervasyon zaman aşımına uğratılırken bir sorun oluştu: ${errorMessage}`,
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
