import { useState } from "react";

interface ValidateShareholderParams {
  sacrificeId: string;
  newShareholderCount: number;
}

interface ValidationResult {
  isValid: boolean;
  currentCount: number;
  newCount: number;
  totalCount: number;
}

/**
 * Hook to validate that the total number of shareholders for a sacrifice 
 * doesn't exceed the maximum (7)
 */
export const useValidateShareholders = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ValidationResult | null>(null);

  const validate = async ({ sacrificeId, newShareholderCount }: ValidateShareholderParams) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!sacrificeId) {
        throw new Error("Sacrifice ID is required");
      }

      // Fetch current shareholder count from the API
      const response = await fetch(`/api/get-shareholder-count-by-sacrifice-id?sacrifice_id=${sacrificeId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch shareholder count");
      }

      const responseData = await response.json();
      const currentShareholderCount = responseData.count || 0;

      // Calculate total count after adding new shareholders
      const totalCount = currentShareholderCount + newShareholderCount;

      // Check if total exceeds maximum (7)
      if (totalCount > 7) {
        throw new Error(`Şu anda yeterli sayıda hisse yok. Lütfen en az ${totalCount - 7} hissedar azaltarak tekrar deneyiniz.`);
      }

      // Set the validation result
      const result = {
        isValid: true,
        currentCount: currentShareholderCount,
        newCount: newShareholderCount,
        totalCount
      };

      setData(result);
      setIsLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  return {
    validate,
    mutateAsync: validate, // React Query uyumluluğu için eklendi
    isLoading,
    error,
    data,
    isPending: isLoading,
    status: isLoading ? 'loading' : error ? 'error' : 'idle'
  };
}; 