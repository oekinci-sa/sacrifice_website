"use client";

import { useActiveReservationsStore } from "@/stores/global/useActiveReservationsStore";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { usePublicShareholderCountStore } from "@/stores/only-public-pages/usePublicShareholderCountStore";
import { usePublicYearStore } from "@/stores/only-public-pages/usePublicYearStore";
import { useEffect, useMemo } from "react";

/**
 * Toplam satılan hisse (etiket): sayı hissedar kayıt sayısı (/api/public/shareholders-count) + Realtime.
 * İşlemdeki hisse: aktif rezervasyon store.
 *
 * Yıl: Yüklenen kurbanlık listesi varsa onun `sacrifice_year` (sayım = tablo ile aynı sezon);
 * yoksa `selectedYear` (kampanya yılı). Böylece tenant ayarı eski kalsa bile sayım sıfıra düşmez.
 */
export function HissealLiveStats() {
  const selectedYear = usePublicYearStore((s) => s.selectedYear);
  const sacrifices = useSacrificeStore((s) => s.sacrifices);
  const yearForCount = useMemo(() => {
    const fromTable = sacrifices[0]?.sacrifice_year;
    if (sacrifices.length > 0 && fromTable != null) {
      return fromTable;
    }
    return selectedYear ?? null;
  }, [sacrifices, selectedYear]);

  const totalShareholders = usePublicShareholderCountStore((s) => s.count);
  const fetchCount = usePublicShareholderCountStore((s) => s.fetchCount);
  const disableRealtime = usePublicShareholderCountStore((s) => s.disableRealtime);

  const reservations = useActiveReservationsStore((s) => s.reservations);

  useEffect(() => {
    if (yearForCount == null) return;
    void fetchCount(yearForCount);
    return () => {
      disableRealtime();
    };
  }, [yearForCount, fetchCount, disableRealtime]);

  const inProgressShares = useMemo(() => {
    let n = 0;
    for (const v of Object.values(reservations)) {
      n += v;
    }
    return n;
  }, [reservations]);

  const showInProgress = inProgressShares > 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-6 gap-y-2 text-sm md:text-base text-muted-foreground">
      <span>
        Toplam Satılan Hisse:{" "}
        <span className="font-medium text-foreground tabular-nums">
          {totalShareholders}
        </span>
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
            Şu Anda İşlem Yapılan Hisse Sayısı:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {inProgressShares}
            </span>
          </span>
        </>
      ) : null}
    </div>
  );
}
