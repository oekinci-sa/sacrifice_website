"use client";

import { useEffect, useState } from "react";

export interface PriceInfoItem {
  kg: number;
  price: number;
  soldOut: boolean;
}

export function usePriceInfo() {
  const [items, setItems] = useState<PriceInfoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/price-info")
      .then((res) => res.json())
      .then((data: PriceInfoItem[]) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}
