import { useEffect, useState } from "react";

export function useUnreadContactMessagesCount() {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = async () => {
    try {
      const res = await fetch("/api/admin/contact-messages/unread-count");
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
    window.addEventListener("contact-messages-updated", handler);
    return () => window.removeEventListener("contact-messages-updated", handler);
  }, []);

  return { count: count ?? 0, refetch: fetchCount };
}
