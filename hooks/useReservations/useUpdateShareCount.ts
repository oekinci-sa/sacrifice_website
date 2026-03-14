import { useToast } from "@/components/ui/use-toast";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import {
  GenericReservationMutation,
  UpdateShareCountData,
  UpdateShareCountResponse,
} from "@/types/reservation";
import { useState } from "react";

export const useUpdateShareCount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { refetchSacrifices } = useSacrificeStore();

  const mutate = async ({
    transaction_id,
    share_count,
    operation,
  }: UpdateShareCountData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/update-share-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id, share_count, operation }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const responseData = await response.json();
      await refetchSacrifices();

      setIsLoading(false);
      return responseData as UpdateShareCountResponse;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu";

      toast({
        variant: "destructive",
        title: "Hata",
        description: `Hisse adedini güncellerken bir sorun oluştu: ${errorMessage}`,
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
