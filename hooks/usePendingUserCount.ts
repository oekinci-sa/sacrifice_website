import { useEffect, useState } from "react";

export function usePendingUserCount() {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = async () => {
    try {
      const res = await fetch("/api/admin/users/pending-count");
      if (!res.ok) return;
      const json = await res.json();
      setCount(typeof json.count === "number" ? json.count : 0);
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  useEffect(() => {
    const handler = () => fetchCount();
    window.addEventListener("user-updated", handler);
    return () => window.removeEventListener("user-updated", handler);
  }, []);

  return { count: count ?? 0, refetch: fetchCount };
}
