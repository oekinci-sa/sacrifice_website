import { useQuery } from "@tanstack/react-query";

export const useShareholderCount = (sacrificeId: string | null) => {
  return useQuery({
    queryKey: ["shareholderCount", sacrificeId],
    queryFn: async () => {
      if (!sacrificeId) {
        return 0;
      }
      
      const response = await fetch(`/api/get-shareholder-count-by-sacrifice-id?sacrifice_id=${sacrificeId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch shareholder count");
      }
      const data = await response.json();
      return data.count;
    },
    // Only run the query if we have a sacrificeId
    enabled: !!sacrificeId,
    // Refresh every 30 seconds
    refetchInterval: 30 * 1000,
    // Keep data fresh for 10 seconds
    staleTime: 10 * 1000,
  });
}; 