"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { columns, type ReminderRequest } from "./components/columns";

export default function ReminderTalepleriPage() {
  const [data, setData] = useState<ReminderRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/reminder-requests");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bana Haber Ver Talepleri</h1>
        <p className="text-muted-foreground mt-2">
          Takip sayfasında &quot;Bana haber ver&quot; formunu dolduran kişilerin listesini görebilirsiniz.
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
