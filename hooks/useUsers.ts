import { supabase } from "@/utils/supabaseClient";
import { useCallback, useEffect, useState } from "react";

interface UserData {
  id: string;
  name: string | null;
}

export function useUser(email: string | undefined | null) {
  const [data, setData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    if (!email) {
      setData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: userData, error: queryError } = await supabase
        .from("users")
        .select("id, name")
        .eq("email", email)
        .single();

      if (queryError) throw queryError;
      setData(userData as UserData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refetch = useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  return { data, isLoading, error, refetch };
} 