"use client";

import { useActiveReservationsStore } from "@/stores/global/useActiveReservationsStore";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useMemo } from "react";

/**
 * Yıl içi kurbanlıklar: satılmış toplam hisse (7 - boş) ve aktif rezervasyondaki hisse adedi.
 * Store + Realtime ile güncellenir.
 */
export function HissealLiveStats() {
  const sacrifices = useSacrificeStore((s) => s.sacrifices);
  const reservations = useActiveReservationsStore((s) => s.reservations);

  const { totalSoldShares, inProgressShares } = useMemo(() => {
    let sold = 0;
    for (const s of sacrifices) {
      const empty = s.empty_share ?? 0;
      sold += 7 - empty;
    }
    let inProgress = 0;
    for (const v of Object.values(reservations)) {
      inProgress += v;
    }
    return { totalSoldShares: sold, inProgressShares: inProgress };
  }, [sacrifices, reservations]);

  const showInProgress = inProgressShares > 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-6 gap-y-2 text-sm md:text-base text-muted-foreground">
      <span>
        <span className="font-medium text-foreground tabular-nums">
          {totalSoldShares}
        </span>{" "}
        Alınan Toplam Hisse
      </span>
      {showInProgress ? (
        <>
          <span
            className="text-muted-foreground/80 select-none"
            aria-hidden
          >
            |
          </span>
          <span>
            <span className="font-medium text-foreground tabular-nums">
              {inProgressShares}
            </span>{" "}
            şu anda işlem yapılan hisse
          </span>
        </>
      ) : null}
    </div>
  );
}
