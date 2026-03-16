"use client";

import { sacrificeSchema } from "@/types";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function FilteredSacrificesContent({
  sacrifices,
  onFilteredSacrificesChange
}: {
  sacrifices: sacrificeSchema[];
  onFilteredSacrificesChange: (data: sacrificeSchema[]) => void;
}) {
  const searchParams = useSearchParams();
  const priceParam = searchParams.get("price");

  useEffect(() => {
    if (sacrifices.length === 0) return;

    // Tüm kurbanlıkları göster (tükenenler dahil)
    const visibleSacrifices = sacrifices;

    if (priceParam && !isNaN(Number(priceParam))) {
      const price = Number(priceParam);
      onFilteredSacrificesChange(visibleSacrifices.filter(sacrifice => sacrifice.share_price === price));
    } else {
      onFilteredSacrificesChange(visibleSacrifices);
    }
  }, [sacrifices, priceParam, onFilteredSacrificesChange]);

  return null;
}
