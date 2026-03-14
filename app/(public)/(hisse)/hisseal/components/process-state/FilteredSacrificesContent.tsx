"use client";

import { useActiveReservationsStore } from "@/stores/global/useActiveReservationsStore";
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
  const activeReservations = useActiveReservationsStore(state => state.reservations);

  useEffect(() => {
    if (sacrifices.length === 0) return;

    const availableSacrifices = sacrifices.filter(sacrifice => {
      const hasActiveReservations = Boolean(activeReservations[sacrifice.sacrifice_id]);
      return sacrifice.empty_share > 0 || hasActiveReservations;
    });

    if (priceParam && !isNaN(Number(priceParam))) {
      const price = Number(priceParam);
      onFilteredSacrificesChange(availableSacrifices.filter(sacrifice => sacrifice.share_price === price));
    } else {
      onFilteredSacrificesChange(availableSacrifices);
    }
  }, [sacrifices, priceParam, onFilteredSacrificesChange, activeReservations]);

  return null;
}
