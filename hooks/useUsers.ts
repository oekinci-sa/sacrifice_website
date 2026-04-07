import { useCallback, useEffect, useState } from "react";

interface UserData {
  id: string;
  name: string | null;
}

/**
 * Oturumdaki kullanıcının DB adını yükler.
 * Tarayıcı Supabase istemcisi RLS nedeniyle `users` okuyamayabilir; bu yüzden
 * NextAuth cookie'si ile çalışan GET /api/users/[id] kullanılır.
 */
export function useUser(userId: string | undefined | null) {
  const [data, setData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Kullanıcı bilgisi alınamadı");
      const userData = (await res.json()) as { id: string; name: string | null };
      setData({ id: userData.id, name: userData.name ?? null });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const onUpdate = () => {
      fetchUser();
    };
    window.addEventListener("user-updated", onUpdate);
    return () => window.removeEventListener("user-updated", onUpdate);
  }, [fetchUser]);

  const refetch = useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  return { data, isLoading, error, refetch };
} 