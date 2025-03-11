import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabaseClient";
import { changeLogSchema } from "@/types";
import type { ChangeLog } from "@/app/(admin)/kurban-admin/degisiklik-kayitlari/components/columns";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useChangeLogs() {
  const queryClient = useQueryClient();
  
  // Fetch change logs
  const query = useQuery({
    queryKey: ['changelogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('change_logs')
        .select('*')
        .order('changed_at', { ascending: false });
        
      if (error) throw error;
      return data as changeLogSchema[];
    }
  });

  // Set up realtime subscription
  useEffect(() => {
    const subscription = supabase
      .channel('change_logs_changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'change_logs'
        }, 
        (payload) => {
          // Invalidate and refetch when data changes
          queryClient.invalidateQueries({ queryKey: ['changelogs'] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return query;
} 