"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSearchToolbarTableSkeleton } from "../components/admin-page-skeletons";
import { Search, X } from "lucide-react";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { useEffect, useMemo, useState } from "react";
import { columns, type StageMetric } from "./components/columns";

export default function AsamaMetrikleriPage() {
  const [data, setData] = useState<StageMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/get-stage-metrics");
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

  const filteredData = useMemo(() => {
    const q = normalizeTurkishSearchText(searchTerm.trim());
    if (!q) return data;
    return data.filter((row) => {
      const t = row.tenants;
      const blob = normalizeTurkishSearchText(
        [t?.name, t?.slug, row.stage, String(row.current_sacrifice_number ?? "")]
          .filter(Boolean)
          .join(" ")
      );
      return blob.includes(q);
    });
  }, [data, searchTerm]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aşama Metrikleri</h1>
        <p className="text-muted-foreground mt-2">
          Kesim, kasap ve teslimat aşamalarına ait metrikleri görüntüleyebilirsiniz.
        </p>
      </div>
      {loading ? (
        <AdminSearchToolbarTableSkeleton rows={10} />
      ) : (
        <CustomDataTable
          data={filteredData}
          columns={columns}
          storageKey="asama-metrikleri"
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
                    placeholder="Kiracı, aşama veya kurban no’da ara…"
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
