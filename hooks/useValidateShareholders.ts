import { useMutation } from "@tanstack/react-query";
import { useShareholderCount } from "./useShareholderCount";

interface ValidateShareholderParams {
  sacrificeId: string;
  newShareholderCount: number;
}

/**
 * Hook to validate that the total number of shareholders for a sacrifice 
 * doesn't exceed the maximum (7)
 */
export const useValidateShareholders = () => {
  return useMutation({
    mutationFn: async ({ sacrificeId, newShareholderCount }: ValidateShareholderParams) => {
      if (!sacrificeId) {
        throw new Error("Sacrifice ID is required");
      }
      
      // Fetch current shareholder count from the API
      const response = await fetch(`/api/get-shareholder-count-by-sacrifice-id?sacrifice_id=${sacrificeId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch shareholder count");
      }
      
      const data = await response.json();
      const currentShareholderCount = data.count || 0;
      
      // Calculate total count after adding new shareholders
      const totalCount = currentShareholderCount + newShareholderCount;
      
      // Check if total exceeds maximum (7)
      if (totalCount > 7) {
        throw new Error(`Şu anda yeterli sayıda hisse yok. Lütfen en az ${totalCount - 7} hissedar azaltarak tekrar deneyiniz.`);
      }
      
      // Return the validation result
      return {
        isValid: true,
        currentCount: currentShareholderCount,
        newCount: newShareholderCount,
        totalCount
      };
    }
  });
}; 