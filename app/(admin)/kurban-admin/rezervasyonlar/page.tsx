"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { logReservationRealtime } from "@/lib/debug-reservation-realtime";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { supabase } from "@/utils/supabaseClient";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ColumnSelectorPopover } from "../hissedarlar/tum-hissedarlar/components/column-selector-popover";
import {
  columns,
  REZERVASYONLAR_COLUMN_HEADER_MAP,
  type ReservationTransaction,
} from "./components/columns";
import { ReservationFilters } from "./components/reservation-filters";

function matchesReservationSearch(
  row: ReservationTransaction,
  rawQuery: string
): boolean {
  const trimmed = rawQuery.trim();
  if (!trimmed) return true;
  const qLower = trimmed.toLowerCase();
  const tid = row.transaction_id.toLowerCase();
  if (tid.includes(qLower)) return true;

  const disp = row._displayNo ?? 0;
  if (disp > 0) {
    if (qLower === String(disp)) return true;
    const withDash = `rez-${disp}`;
    if (qLower === withDash || qLower === `rez${disp}`) return true;
    if (withDash.includes(qLower)) return true;
  }

  const qNorm = normalizeTurkishSearchText(trimmed);
  return qNorm.length > 0 && normalizeTurkishSearchText(tid).includes(qNorm);
}

export default function RezervasyonlarPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [data, setData] = useState<ReservationTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const yearRef = useRef(selectedYear);
  yearRef.current = selectedYear;

  const fetchData = useCallback(async (isInitial = true) => {
    const y = yearRef.current;
    logReservationRealtime("[TABLO] fetchData çağrıldı, year:", y, "isInitial:", isInitial);
    if (y == null) return;
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(`/api/get-reservation-transactions?year=${y}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      const transactions = json.transactions ?? [];
      logReservationRealtime("[TABLO] fetchData sonuç:", transactions.length, "kayıt");
      setData(transactions);
    } catch (err) {
      logReservationRealtime("[TABLO] fetchData hata:", err);
      setData([]);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData, selectedYear]);

  useEffect(() => {
    logReservationRealtime("[TABLO] Realtime channel kuruluyor (rezervasyonlar-realtime)");
    const channel = supabase
      .channel("rezervasyonlar-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservation_transactions",
        },
        (payload) => {
          logReservationRealtime("[TABLO] Realtime event alındı", payload?.eventType ?? payload);
          void fetchData(false);
        }
      )
      .subscribe((status) => {
        logReservationRealtime("[TABLO] Channel subscription status:", status);
      });

    return () => {
      logReservationRealtime("[TABLO] Realtime channel kaldırılıyor (unmount)");
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    const handler = () => {
      logReservationRealtime("[TABLO] reservation-updated event alındı");
      fetchData(false);
    };
    window.addEventListener("reservation-updated", handler);
    return () => window.removeEventListener("reservation-updated", handler);
  }, [fetchData]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    return data.filter((row) => matchesReservationSearch(row, searchTerm));
  }, [data, searchTerm]);

  const deviceReservationCounts = useMemo(() => {
    let mobile = 0;
    let desktop = 0;
    for (const row of data) {
      const k = row.client_device_category ?? "unknown";
      if (k === "mobile") mobile += 1;
      else desktop += 1;
    }
    return { mobile, desktop };
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Rezervasyonlar</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Hisse rezervasyonlarını ve durumlarını takip edebilirsiniz.
        </p>
      </div>
      {!loading && data.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Mobil</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">
              {deviceReservationCounts.mobile}
            </p>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Masaüstü</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">
              {deviceReservationCounts.desktop}
            </p>
          </div>
        </div>
      ) : null}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <CustomDataTable
          data={filteredData}
          columns={columns}
          storageKey="rezervasyonlar"
          pageSizeOptions={[10, 20, 50, 100]}
          tableSize="medium"
          initialState={{
            columnVisibility: {
              transaction_id: false,
              created_at: false,
              client_device_category: false,
            },
          }}
          filters={({
            table,
            columnFilters,
            columnOrder,
            onColumnOrderChange,
            resetColumnLayout,
          }) => {
            const hasAnyFilter =
              columnFilters.length > 0 || searchTerm.trim().length > 0;
            return (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <div className="relative w-full sm:w-96 max-w-full min-w-0">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      type="search"
                      placeholder="Rezervasyon no (örn. Rez-3) veya işlem kodu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9"
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ColumnSelectorPopover
                      table={table}
                      columnHeaderMap={REZERVASYONLAR_COLUMN_HEADER_MAP}
                      columnOrder={columnOrder ?? []}
                      onColumnOrderChange={onColumnOrderChange}
                      onResetColumnLayout={resetColumnLayout}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
                  <div className="flex flex-1 flex-wrap items-center gap-3 min-w-0">
                    <ReservationFilters table={table} columnFilters={columnFilters} />
                  </div>
                  {hasAnyFilter ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-dashed gap-1.5 shrink-0 ml-auto"
                      onClick={() => {
                        table.resetColumnFilters();
                        setSearchTerm("");
                      }}
                    >
                      <X className="h-4 w-4 shrink-0" />
                      Tüm filtreleri temizle
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
