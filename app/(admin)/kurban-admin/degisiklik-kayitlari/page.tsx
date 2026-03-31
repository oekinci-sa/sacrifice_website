"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangeLogs } from "@/hooks/useChangeLogs";
import { getTableLabelTr } from "@/lib/change-log-labels";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { useMemo, useState } from "react";
import {
  ChangeLogFilters,
  type ChangeLogDatePreset,
} from "./components/change-log-filters";
import {
  ChangeLog,
  ChangeLogExpandedRow,
  ChangeLogsTooltipProvider,
  columns,
} from "./components/columns";

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
  const [rowIdFilter, setRowIdFilter] = useState("");
  // Açık satırların event_id seti
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data = [], isLoading, error } = useChangeLogs();

  const toggleExpand = (eventId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const filteredData = useMemo(() => {
    let rows = data;

    // Tarih filtresi
    const rangeStart = startOfFilterRange(datePreset);
    if (rangeStart) {
      rows = rows.filter((log) => new Date(log.changed_at) >= rangeStart);
    }

    // Metin araması (tüm alanlar)
    const q = normalizeTurkishSearchText(searchTerm.trim());
    if (q) {
      rows = rows.filter((log) => {
        const blob = normalizeTurkishSearchText(
          [
            log.description,
            log.column_name,
            log.change_owner,
            log.old_value,
            log.new_value,
            log.table_name,
            getTableLabelTr(log.table_name),
            log.change_type,
            log.row_id,
            String(log.event_id),
          ]
            .filter(Boolean)
            .join(" ")
        );
        return blob.includes(q);
      });
    }

    // Kayıt filtresi (row_id — normalize contains; ham + isim kısmı)
    const rq = normalizeTurkishSearchText(rowIdFilter.trim());
    if (rq) {
      rows = rows.filter((log) => {
        const raw = normalizeTurkishSearchText(log.row_id ?? "");
        const parenIdx = log.row_id?.lastIndexOf("(") ?? -1;
        const namePart =
          parenIdx > 0
            ? normalizeTurkishSearchText(log.row_id.slice(0, parenIdx).trim())
            : "";
        return raw.includes(rq) || namePart.includes(rq);
      });
    }

    return rows;
  }, [data, searchTerm, datePreset, rowIdFilter]);

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
        <ChangeLogsTooltipProvider>
          <CustomDataTable
            data={filteredData}
            columns={columns}
            storageKey="degisiklik-kayitlari"
            pageSizeOptions={[10, 20, 50, 100]}
            tableSize="medium"
            stickyHeader
            initialState={{
              columnVisibility: {
                // "Kaynak" (table_name) varsayılan gizli — kullanıcı açabilir
                table_name: false,
              },
            }}
            meta={{ expandedIds, toggleExpand }}
            renderExpandedRow={(row: { original: ChangeLog }) =>
              expandedIds.has(row.original.event_id) ? (
                <ChangeLogExpandedRow log={row.original} />
              ) : null
            }
            filters={({ table, columnFilters }) => (
              <ChangeLogFilters
                table={table}
                columnFilters={columnFilters}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                datePreset={datePreset}
                onDatePresetChange={setDatePreset}
                rowIdFilter={rowIdFilter}
                onRowIdFilterChange={setRowIdFilter}
              />
            )}
          />
        </ChangeLogsTooltipProvider>
      )}
    </div>
  );
}
