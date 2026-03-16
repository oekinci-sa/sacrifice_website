import { useCallback, useEffect, useState } from "react";

export const MISMATCHES_UPDATED_EVENT = "mismatches-updated";

export function useUnacknowledgedMismatchesCount() {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/mismatched-shares");
      if (!res.ok) return;
      const { items } = await res.json();
      const unackCount = (items ?? []).filter(
        (r: { acknowledged_at: string | null }) => !r.acknowledged_at
      ).length;
      setCount(unackCount);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    const handler = () => fetchCount();
    window.addEventListener(MISMATCHES_UPDATED_EVENT, handler);
    return () => window.removeEventListener(MISMATCHES_UPDATED_EVENT, handler);
  }, [fetchCount]);

  return { count };
}
