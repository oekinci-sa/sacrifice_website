"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangeLogs } from "@/hooks/useChangeLogs";
import { useMemo, useState } from "react";
import {
  ChangeLogFilters,
  type ChangeLogDatePreset,
} from "./components/change-log-filters";
import { columns } from "./components/columns";

function startOfFilterRange(preset: ChangeLogDatePreset): Date | null {
  if (preset === "all") return null;
  const now = new Date();
  if (preset === "today") {
    const s = new Date(now);
    s.setHours(0, 0, 0, 0);
    return s;
  }
  const days = preset === "last7" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export default function ChangeLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [datePreset, setDatePreset] = useState<ChangeLogDatePreset>("all");

  const { data = [], isLoading, error } = useChangeLogs();

  const filteredData = useMemo(() => {
    let rows = data;
    const rangeStart = startOfFilterRange(datePreset);
    if (rangeStart) {
      rows = rows.filter((log) => new Date(log.changed_at) >= rangeStart);
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      rows = rows.filter((log) => {
        const blob = [
          log.description,
          log.column_name,
          log.change_owner,
          log.old_value,
          log.new_value,
          log.table_name,
          log.change_type,
          log.row_id,
          String(log.event_id),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return rows;
  }, [data, searchTerm, datePreset]);

  if (error) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Değişiklik Kayıtları</h1>
        <div className="bg-red-50 p-4 rounded-md text-red-500">
          Değişiklik kayıtları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight mt-0">Değişiklik Kayıtları</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Kurbanlık ve hissedar değişiklik geçmişini inceleyebilirsiniz.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <CustomDataTable
          data={filteredData}
          columns={columns}
          storageKey="degisiklik-kayitlari"
          pageSizeOptions={[10, 20, 50, 100]}
          tableSize="medium"
          filters={({ table, columnFilters }) => (
            <ChangeLogFilters
              table={table}
              columnFilters={columnFilters}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              datePreset={datePreset}
              onDatePresetChange={setDatePreset}
            />
          )}
        />
      )}
    </div>
  );
} 