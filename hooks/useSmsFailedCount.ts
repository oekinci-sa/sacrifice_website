import { useCallback, useEffect, useState } from "react";

export function useSmsFailedCount(year?: number | null) {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const url =
        year != null
          ? `/api/admin/sms/sends/failed-count?year=${year}`
          : "/api/admin/sms/sends/failed-count";
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
    window.addEventListener("sms-sends-updated", handler);
    return () => window.removeEventListener("sms-sends-updated", handler);
  }, [fetchCount]);

  return { count: count ?? 0, isLoading: count === null, refetch: fetchCount };
}
