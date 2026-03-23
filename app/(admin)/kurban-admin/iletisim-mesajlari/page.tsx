"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { columns, type ContactMessage } from "./components/columns";

export default function IletisimMesajlariPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [data, setData] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return data;
    return data.filter((m) => {
      const blob = [m.name, m.phone, m.email, m.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [data, searchTerm]);

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
              data={filteredData}
              columns={columns}
              storageKey="iletisim-mesajlari"
              pageSizeOptions={[10, 20, 50]}
              tableSize="medium"
              filters={({ table, columnFilters }) => {
                const hasAnyFilter =
                  searchTerm.trim().length > 0 ||
                  filter !== "all" ||
                  columnFilters.length > 0;
                return (
                  <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
                    <div className="relative w-96 max-w-full min-w-0 sm:w-[28rem]">
                      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        placeholder="Ad, telefon, e-posta veya mesajda ara…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                        aria-label="Tabloda ara"
                      />
                    </div>
                    {hasAnyFilter ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-dashed gap-1.5 shrink-0 ml-auto"
                        onClick={() => {
                          setSearchTerm("");
                          setFilter("all");
                          table.resetColumnFilters();
                        }}
                      >
                        <X className="h-4 w-4 shrink-0" />
                        Tüm filtreleri temizle
                      </Button>
                    ) : null}
                  </div>
                );
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
