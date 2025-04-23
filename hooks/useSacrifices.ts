import { useToast } from "@/components/ui/use-toast";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useEffect, useState } from "react";

// Use sacrifices hook with Zustand
export const useSacrifices = () => {
  const {
    sacrifices,
    refetchSacrifices,
    isLoadingSacrifices,
    error: storeError,
    isInitialized
  } = useSacrificeStore();

  const [isLoading, setIsLoading] = useState(!isInitialized);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      setIsLoading(true);
      refetchSacrifices()
        .then(() => setIsLoading(false))
        .catch(err => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [isInitialized, refetchSacrifices]);

  return {
    data: sacrifices,
    isLoading: isLoading || isLoadingSacrifices,
    error: error || storeError,
    refetch: refetchSacrifices
  };
};

// Update sacrifice hook with Zustand
export const useUpdateSacrifice = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { updateSacrifice } = useSacrificeStore();

  const mutate = async ({
    sacrificeId,
    emptyShare,
  }: {
    sacrificeId: string;
    emptyShare: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Using the new server-side API endpoint
      const response = await fetch("/api/update-sacrifice-share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sacrificeId, emptyShare }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update sacrifice");
      }

      const updatedSacrifice = await response.json();

      // Update Zustand store
      updateSacrifice(updatedSacrifice);

      setIsLoading(false);
      return updatedSacrifice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update sacrifice";

      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hisse seçimi yapılırken bir hata oluştu: " + errorMessage,
      });

      setError(err instanceof Error ? err : new Error(errorMessage));
      setIsLoading(false);
      throw err;
    }
  };

  return {
    mutate,
    isLoading,
    error
  };
};
