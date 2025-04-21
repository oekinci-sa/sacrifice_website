import { useQuery } from "@tanstack/react-query";
import type { ChangeLog } from "@/app/(admin)/kurban-admin/degisiklik-kayitlari/components/columns";

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
 * Uses React Query to manage data fetching, caching, and refetching
 * Data is fetched from the API endpoint only when the component is mounted
 * No realtime subscription is used
 */
export const useChangeLogs = () => {
  return useQuery<changeLogSchema[], Error, ChangeLog[]>({
    queryKey: ["change-logs"],
    queryFn: async () => {
      const response = await fetch("/api/get-change-logs");
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch change logs");
      }
      
      const data = await response.json();
      return data.logs;
    },
    // Transform the raw API data to match the ChangeLog type
    select: (data) => {
      return data.map(log => ({
        ...log,
        // Ensure change_type is one of the allowed values
        change_type: log.change_type as "Ekleme" | "Güncelleme" | "Silme"
      }));
    },
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: true,
  });
}; 