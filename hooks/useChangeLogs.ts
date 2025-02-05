import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabaseClient";
import { changeLogSchema } from "@/types";
import type { ChangeLog } from "@/app/(admin)/kurban-admin/degisiklik-kayitlari/components/columns";

export function useChangeLogs() {
  return useQuery({
    queryKey: ["changeLogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("change_logs")
        .select("*")
        .order("changed_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Convert event_id to string and ensure type compatibility
      return (data as changeLogSchema[]).map((log): ChangeLog => ({
        ...log,
        event_id: log.event_id.toString(),
        old_value: log.old_value ?? "",
        new_value: log.new_value ?? "",
        change_type: log.change_type as "Ekleme" | "Güncelleme" | "Silme",
      }));
    },
  });
} 