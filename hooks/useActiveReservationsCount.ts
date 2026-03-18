import { useCallback, useEffect, useState } from "react";

export function useActiveReservationsCount(year?: number | null) {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const url = year != null
        ? `/api/admin/active-reservations-count?year=${year}`
        : "/api/admin/active-reservations-count";
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

  return { count: count ?? 0, isLoading: count === null, refetch: fetchCount };
}
