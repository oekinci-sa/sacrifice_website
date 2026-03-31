import type { ChangeLog } from "@/app/(admin)/kurban-admin/degisiklik-kayitlari/components/columns";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useEffect, useState } from "react";

export interface changeLogSchema {
  event_id: number;
  table_name: string;
  row_id: string;
  row_id_label?: string | null;
  column_name: string | null;
  old_value: string | null;
  new_value: string | null;
  change_type: string;
  description: string;
  change_owner: string | null;
  changed_at: string;
  correlation_id: string | null;
  log_layer: string | null;
  sacrifice_year: number | null;
}

/**
 * Hook for fetching all change logs
 * Uses useState and useEffect to manage data fetching and refetching
 * Data is fetched from the API endpoint when the component is mounted
 * No realtime subscription is used
 */
export const useChangeLogs = () => {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [data, setData] = useState<ChangeLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  const fetchChangeLogs = async () => {
    if (selectedYear == null) {
      setData([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/get-change-logs?year=${selectedYear}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch change logs");
      }

      const result = await response.json();

      // Transform the raw API data to match the ChangeLog type
      const transformedData: ChangeLog[] = result.logs.map((log: changeLogSchema) => ({
        ...log,
        row_id_label: log.row_id_label ?? null,
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

  useEffect(() => {
    if (selectedYear == null) {
      setData([]);
      setError(null);
      return;
    }
    fetchChangeLogs();
  }, [selectedYear]);

  return {
    data,
    isLoading,
    error,
    isRefetching,
    refetch: fetchChangeLogs
  };
}; 