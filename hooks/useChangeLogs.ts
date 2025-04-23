import type { ChangeLog } from "@/app/(admin)/kurban-admin/degisiklik-kayitlari/components/columns";
import { useEffect, useState } from "react";

export interface changeLogSchema {
  event_id: number;
  table_name: string;
  row_id: string;
  column_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: string;
  description: string;
  change_owner: string;
  changed_at: string;
}

/**
 * Hook for fetching all change logs
 * Uses useState and useEffect to manage data fetching and refetching
 * Data is fetched from the API endpoint when the component is mounted
 * No realtime subscription is used
 */
export const useChangeLogs = () => {
  const [data, setData] = useState<ChangeLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  // Function to fetch change logs
  const fetchChangeLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/get-change-logs");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch change logs");
      }

      const result = await response.json();

      // Transform the raw API data to match the ChangeLog type
      const transformedData: ChangeLog[] = result.logs.map((log: changeLogSchema) => ({
        ...log,
        // Ensure change_type is one of the allowed values
        change_type: log.change_type as "Ekleme" | "Güncelleme" | "Silme"
      }));

      setData(transformedData);
      return transformedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchChangeLogs();

    // Setup window focus event listener for refetching
    const handleFocus = () => {
      setIsRefetching(true);
      fetchChangeLogs();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    isRefetching,
    refetch: fetchChangeLogs
  };
}; 