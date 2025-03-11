import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabaseClient";

type User = {
  id: string;
  name: string;
  email: string;
};

export function useUser(email: string | undefined | null) {
  return useQuery({
    queryKey: ['user', email],
    queryFn: async () => {
      if (!email) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!email, // email varsa query'i çalıştır
  });
} 