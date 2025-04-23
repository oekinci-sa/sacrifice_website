import { supabase } from "@/utils/supabaseClient";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

export function useUser(email: string | undefined | null) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!email) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fetchUser = async () => {
      try {
        const { data: userData, error: queryError } = await supabase
          .from('users')
          .select('name')
          .eq('email', email)
          .single();

        if (queryError) throw queryError;

        setData(userData);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [email]);

  return { data, isLoading, error };
} 