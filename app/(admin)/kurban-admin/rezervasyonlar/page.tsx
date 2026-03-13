"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { columns, type ReservationTransaction } from "./components/columns";

export default function RezervasyonlarPage() {
  const [data, setData] = useState<ReservationTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/get-reservation-transactions");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        const transactions = json.transactions ?? [];
        setData(transactions.map((t: ReservationTransaction, i: number) => ({ ...t, _displayNo: i + 1 })));
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Rezervasyonlar</h2>
        <p className="text-muted-foreground">
          reservation_transactions tablosu – tüm rezervasyon işlemleri
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
        />
      )}
    </div>
  );
}
