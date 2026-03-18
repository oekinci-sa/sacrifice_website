import { useCallback, useEffect, useState } from "react";

export function useUnreadContactMessagesCount(year?: number | null) {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const url = year != null
        ? `/api/admin/contact-messages/unread-count?year=${year}`
        : "/api/admin/contact-messages/unread-count";
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      setCount(typeof json.count === "number" ? json.count : 0);
    } catch {
      setCount(0);
    }
  }, [year]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    const handler = () => fetchCount();
    window.addEventListener("contact-messages-updated", handler);
    return () => window.removeEventListener("contact-messages-updated", handler);
  }, [fetchCount]);

  return { count: count ?? 0, isLoading: count === null, refetch: fetchCount };
}
