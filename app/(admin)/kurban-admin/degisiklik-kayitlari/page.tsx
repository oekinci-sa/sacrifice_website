"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { AdminDataTablePageSkeleton } from "../components/admin-page-skeletons";
import { useChangeLogs } from "@/hooks/useChangeLogs";
import { CHANGE_LOG_ROW_UUID_RE, formatRowIdDisplay } from "@/lib/change-log-labels";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { useMemo, useState } from "react";
import {
  ChangeLogFilters,
  type ChangeLogDatePreset,
} from "./components/change-log-filters";
import {
  CHANGE_LOG_COLUMN_HEADER_MAP,
  ChangeLogExpandedRow,
  ChangeLogsTooltipProvider,
  ChangeLogViewRow,
  columns,
} from "./components/columns";
import { buildChangeLogTableRows } from "@/lib/change-log-grouping";

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

    // Arama: yalnızca Kayıt (görünen metin); ham UUID ile arama yok
    const q = normalizeTurkishSearchText(searchTerm.trim());
    if (q) {
      const searchLooksLikeUuid = CHANGE_LOG_ROW_UUID_RE.test(searchTerm.trim());
      if (searchLooksLikeUuid) {
        rows = [];
      } else {
        rows = rows.filter((log) => {
          const display = formatRowIdDisplay(
            log.table_name,
            log.row_id ?? "",
            log.row_id_label
          );
          const disp = normalizeTurkishSearchText(display);
          const label = log.row_id_label
            ? normalizeTurkishSearchText(log.row_id_label)
            : "";
          const raw = String(log.row_id ?? "").trim();
          if (CHANGE_LOG_ROW_UUID_RE.test(raw)) {
            return disp.includes(q) || (label.length > 0 && label.includes(q));
          }
          const rawN = normalizeTurkishSearchText(raw);
          return disp.includes(q) || rawN.includes(q) || (label.length > 0 && label.includes(q));
        });
      }
    }

    return rows;
  }, [data, searchTerm, datePreset]);

  const tableRows = useMemo(
    () => buildChangeLogTableRows(filteredData),
    [filteredData]
  );

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
        <AdminDataTablePageSkeleton rows={12} />
      ) : (
        <ChangeLogsTooltipProvider>
          <CustomDataTable<ChangeLogViewRow, unknown>
            data={tableRows}
            columns={columns}
            columnHeaderLabels={CHANGE_LOG_COLUMN_HEADER_MAP}
            storageKey="degisiklik-kayitlari"
            pageSizeOptions={[10, 20, 50, 100, 200, 500, 1000, 5000]}
            defaultPageSize={100}
            tableSize="medium"
            initialState={{
              columnVisibility: {
                table_name: true,
              },
            }}
            meta={{ expandedIds, toggleExpand }}
            renderExpandedRow={(row: { original: ChangeLogViewRow }) =>
              expandedIds.has(row.original.event_id) ? (
                <ChangeLogExpandedRow log={row.original} />
              ) : null
            }
            filters={({
              table,
              columnFilters,
              columnOrder,
              onColumnOrderChange,
              resetColumnLayout,
            }) => (
              <ChangeLogFilters
                table={table}
                columnFilters={columnFilters}
                columnOrder={columnOrder}
                onColumnOrderChange={onColumnOrderChange}
                resetColumnLayout={resetColumnLayout}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                datePreset={datePreset}
                onDatePresetChange={setDatePreset}
              />
            )}
          />
        </ChangeLogsTooltipProvider>
      )}
    </div>
  );
}
