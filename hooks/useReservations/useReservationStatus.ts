import { ReservationStatusData } from "./types";
import { useEffect, useState } from "react";

export const useReservationStatus = (transaction_id: string) => {
  const [data, setData] = useState<ReservationStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Clear stale reservation status immediately when the transaction changes.
    setData(null);
    setError(null);

    if (!transaction_id || transaction_id.length === 0) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const signal = controller.signal;

    const checkStatus = async () => {
      if (!isMounted) return;
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/check-reservation-status?transaction_id=${transaction_id}`,
          { signal }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();

        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };

    checkStatus();
    // Yedek yoklama — asıl güncelleme Realtime ile gelir; bu aralık güvenlik ağıdır.
    const interval = setInterval(checkStatus, 30000);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [transaction_id]);

  return { data, isLoading, error };
};
