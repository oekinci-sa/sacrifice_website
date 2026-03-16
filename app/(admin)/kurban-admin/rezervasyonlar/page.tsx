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
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Rezervasyonlar</h1>
        <p className="text-muted-foreground mt-2 max-w-[50%]">
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
        />
      )}
    </div>
  );
}
