"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { logReservationRealtime } from "@/lib/debug-reservation-realtime";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { supabase } from "@/utils/supabaseClient";
import { useCallback, useEffect, useRef, useState } from "react";
import { columns, type ReservationTransaction } from "./components/columns";
import { ReservationFilters } from "./components/reservation-filters";

export default function RezervasyonlarPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [data, setData] = useState<ReservationTransaction[]>([]);
  const [loading, setLoading] = useState(true);
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
          fetchData(false);
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

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Rezervasyonlar</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Hisse rezervasyonlarını ve durumlarını takip edebilirsiniz.
        </p>
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <CustomDataTable
          data={data}
          columns={columns}
          pageSizeOptions={[10, 20, 50, 100]}
          tableSize="medium"
          filters={({ table }) => <ReservationFilters table={table} />}
        />
      )}
    </div>
  );
}
