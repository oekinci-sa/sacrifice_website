import { useState } from "react";

/**
 * Hook to fetch the current number of shareholders for a given sacrifice ID
 */
export const useShareholderCount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the current number of shareholders for a given sacrifice ID
   * @param sacrificeId The ID of the sacrifice to check
   * @returns The number of shareholders or null if an error occurred
   */
  const getShareholderCount = async (sacrificeId: string): Promise<number | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/get-shareholder-count-by-sacrifice-id?sacrifice_id=${sacrificeId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch shareholder count');
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error("Error fetching shareholder count:", error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getShareholderCount,
    isLoading,
    error
  };
};

export default useShareholderCount; 