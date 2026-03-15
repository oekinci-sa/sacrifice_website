import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { usePublicYearStore } from "@/stores/only-public-pages/usePublicYearStore";
import { useEffect, useState } from "react";

export const useEmptyShareCount = () => {
  const { selectedYear } = usePublicYearStore();
  const { totalEmptyShares, isInitialized, refetchSacrifices } = useSacrificeStore();
  const [isLoading, setIsLoading] = useState(!isInitialized);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      setIsLoading(true);
      refetchSacrifices(selectedYear ?? undefined)
        .then(() => setIsLoading(false))
        .catch(err => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [isInitialized, refetchSacrifices, selectedYear]);

  return {
    data: totalEmptyShares,
    isLoading,
    error,
    refetch: refetchSacrifices
  };
};
