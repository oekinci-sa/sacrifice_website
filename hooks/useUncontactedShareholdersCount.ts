import { useCallback, useEffect, useState } from "react";

export function useUncontactedShareholdersCount(year?: number | null) {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const url = year != null
        ? `/api/admin/shareholders/uncontacted-count?year=${year}`
        : "/api/admin/shareholders/uncontacted-count";
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
    const handler = () => {
      void fetchCount();
    };
    window.addEventListener("shareholders-updated", handler);
    return () => window.removeEventListener("shareholders-updated", handler);
  }, [fetchCount]);

  return { count: count ?? 0, isLoading: count === null, refetch: fetchCount };
}
