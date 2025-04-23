import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useEffect, useState } from "react";

export const useEmptyShareCount = () => {
  const { totalEmptyShares, isInitialized, refetchSacrifices } = useSacrificeStore();
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
    data: totalEmptyShares,
    isLoading,
    error,
    refetch: refetchSacrifices
  };
};
