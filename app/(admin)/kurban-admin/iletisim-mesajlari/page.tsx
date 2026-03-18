"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useCallback, useEffect, useState } from "react";
import { columns, type ContactMessage } from "./components/columns";

export default function IletisimMesajlariPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [data, setData] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");

  const fetchData = useCallback(async () => {
    if (selectedYear == null) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/contact-messages?filter=${filter}&year=${selectedYear}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener("contact-messages-updated", handler);
    return () => window.removeEventListener("contact-messages-updated", handler);
  }, [fetchData]);

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">İletişim Mesajları</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          İletişim formundan gelen mesajları görüntüleyebilir ve yönetebilirsiniz.
        </p>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | "read" | "unread")}
      >
        <TabsList>
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="unread">Okunmamış</TabsTrigger>
          <TabsTrigger value="read">Okunmuş</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
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
              pageSizeOptions={[10, 20, 50]}
              tableSize="medium"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
