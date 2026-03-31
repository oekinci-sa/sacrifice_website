"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSearchToolbarTableSkeleton } from "../components/admin-page-skeletons";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { Search, X } from "lucide-react";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { useEffect, useMemo, useState } from "react";
import { columns, type ReminderRequest } from "./components/columns";

export default function ReminderTalepleriPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [data, setData] = useState<ReminderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (selectedYear == null) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/reminder-requests?year=${selectedYear}`);
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
  }, [selectedYear]);

  const filteredData = useMemo(() => {
    const q = normalizeTurkishSearchText(searchTerm.trim());
    if (!q) return data;
    return data.filter((r) => {
      const blob = normalizeTurkishSearchText(
        [r.name, r.phone, String(r.sacrifice_year)].filter(Boolean).join(" ")
      );
      return blob.includes(q);
    });
  }, [data, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Bana Haber Ver Talepleri</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          &quot;Bana haber ver&quot; formunu dolduran kişilerin listesi.
        </p>
      </div>
      {loading ? (
        <AdminSearchToolbarTableSkeleton rows={10} />
      ) : (
        <CustomDataTable
          data={filteredData}
          columns={columns}
          storageKey="reminder-talepleri"
          pageSizeOptions={[10, 20, 50, 100]}
          tableSize="medium"
          filters={({ table, columnFilters }) => {
            const hasAnyFilter =
              searchTerm.trim().length > 0 || columnFilters.length > 0;
            return (
              <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
                <div className="relative w-96 max-w-full min-w-0 sm:w-[28rem]">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    placeholder="Ad, telefon veya yılda ara…"
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
    </div>
  );
}
