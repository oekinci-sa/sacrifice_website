"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useEffect, useState } from "react";
import { columns, type ReservationTransaction } from "./components/columns";

export default function RezervasyonlarPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [data, setData] = useState<ReservationTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedYear == null) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/get-reservation-transactions?year=${selectedYear}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        const transactions = json.transactions ?? [];
        setData(transactions);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

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
        />
      )}
    </div>
  );
}
