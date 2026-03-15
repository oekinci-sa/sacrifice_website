import { useEffect, useState } from "react";

export function useShareholdersCount(year?: number | null) {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = async () => {
    try {
      const url = year != null
        ? `/api/admin/shareholders/count?year=${year}`
        : "/api/admin/shareholders/count";
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      setCount(typeof json.count === "number" ? json.count : 0);
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    fetchCount();
  }, [year]);

  useEffect(() => {
    const handler = () => fetchCount();
    window.addEventListener("shareholders-updated", handler);
    return () => window.removeEventListener("shareholders-updated", handler);
  }, []);

  return { count: count ?? 0, refetch: fetchCount };
}
