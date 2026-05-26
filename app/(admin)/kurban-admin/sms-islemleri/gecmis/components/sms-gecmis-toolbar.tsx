"use client";

import { ColumnSelectorPopover } from "@/app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/column-selector-popover";
import { Button } from "@/components/ui/button";
import { ColumnFiltersState, Table, VisibilityState } from "@tanstack/react-table";
import { Trash2, X } from "lucide-react";
import { memo } from "react";
import { smsGecmisColumnHeaderLabels, SmsSendRow } from "./sms-gecmis-columns";
import { SmsGecmisFilters } from "./sms-gecmis-filters";
import { SmsGecmisSearch } from "./sms-gecmis-search";

export const SMS_GECMIS_COLUMN_HEADER_MAP = smsGecmisColumnHeaderLabels;

type ToolbarProps = {
  table: Table<SmsSendRow>;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  onColumnOrderChange?: (order: string[]) => void;
  onResetColumnLayout?: () => void;
  columnOrder: string[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  canDelete?: boolean;
  onBulkDelete?: (ids: string[]) => void;
  bulkDeleting?: boolean;
  selectedRowCount: number;
};

export const SmsGecmisToolbar = memo(function SmsGecmisToolbar({
  table,
  columnFilters,
  columnVisibility: _columnVisibility,
  onColumnFiltersChange,
  onColumnOrderChange,
  onResetColumnLayout,
  columnOrder,
  searchTerm,
  setSearchTerm,
  canDelete = false,
  onBulkDelete,
  bulkDeleting = false,
  selectedRowCount,
}: ToolbarProps) {
  const isFiltered = columnFilters.length > 0 || searchTerm.trim().length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleResetFilters = () => {
    table.resetColumnFilters();
    onColumnFiltersChange([]);
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between w-full gap-3">
        <SmsGecmisSearch
          onSearch={setSearchTerm}
          className="w-96 sm:w-[28rem] max-w-full min-w-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          {canDelete && selectedRowCount > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 flex items-center gap-2"
              disabled={bulkDeleting}
              onClick={() => onBulkDelete?.(selectedRows.map((r) => r.original.id))}
            >
              <Trash2 className="h-4 w-4" />
              Seçilenleri sil ({selectedRowCount.toLocaleString("tr-TR")})
            </Button>
          )}
          <ColumnSelectorPopover
            table={table}
            columnHeaderMap={SMS_GECMIS_COLUMN_HEADER_MAP}
            columnOrder={columnOrder ?? []}
            onColumnOrderChange={onColumnOrderChange}
            onResetColumnLayout={onResetColumnLayout}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-0">
          <SmsGecmisFilters table={table} />
        </div>
        {isFiltered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 px-2 flex items-center gap-1 shrink-0 ml-auto"
          >
            <X className="h-4 w-4 mr-1" />
            Tüm filtreleri temizle
          </Button>
        ) : null}
      </div>
    </div>
  );
});

SmsGecmisToolbar.displayName = "SmsGecmisToolbar";
