"use client";

import { Button } from "@/components/ui/button";
import { hissedarlarColumnHeaderLabels } from "@/lib/admin-table-column-labels/hissedarlar";
import { exportHissedarlarToExcel } from "@/lib/excel-export/hissedarlar-excel";
import { shareholderSchema } from "@/types";
import { ColumnFiltersState, Table, VisibilityState } from "@tanstack/react-table";
import { Download, X } from "lucide-react";
import { memo, useState } from "react";
import { ExcelExportConfirmDialog } from "@/components/excel-export/excel-export-confirm-dialog";
import { ColumnSelectorPopover } from "./column-selector-popover";
import { ShareholderFilters } from "./shareholder-filters";
import { ShareholderSearch } from "./shareholder-search";

/** Sütun seçici + Excel — tek kaynak: `hissedarlarColumnHeaderLabels` */
export const SHAREHOLDER_COLUMN_HEADER_MAP = hissedarlarColumnHeaderLabels;

type ToolbarProps = {
  table: Table<shareholderSchema>;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  onColumnOrderChange?: (order: string[]) => void;
  onResetColumnLayout?: () => void;
  columnOrder: string[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

/**
 * Modül düzeyinde tanımlı — sayfa içinde oluşturulmaz; aksi halde her parent render'da
 * yeni bileşen tipi oluşur ve ShareholderSearch remount olup input metnini sıfırlar.
 */
export const HissedarlarTableToolbar = memo(function HissedarlarTableToolbar({
  table,
  columnFilters,
  columnVisibility: _columnVisibility,
  onColumnFiltersChange,
  onColumnOrderChange,
  onResetColumnLayout,
  columnOrder,
  searchTerm,
  setSearchTerm,
}: ToolbarProps) {
  const [excelConfirmOpen, setExcelConfirmOpen] = useState(false);
  const isFiltered = columnFilters.length > 0 || searchTerm.trim().length > 0;

  const handleResetFilters = () => {
    table.resetColumnFilters();
    onColumnFiltersChange([]);
    setSearchTerm("");
  };

  return (
    <>
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between w-full gap-3">
        <ShareholderSearch
          onSearch={setSearchTerm}
          className="w-96 sm:w-[28rem] max-w-full min-w-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          <ColumnSelectorPopover
            table={table}
            columnHeaderMap={SHAREHOLDER_COLUMN_HEADER_MAP}
            columnOrder={columnOrder ?? []}
            onColumnOrderChange={onColumnOrderChange}
            onResetColumnLayout={onResetColumnLayout}
          />
          <Button
            type="button"
            onClick={() => setExcelConfirmOpen(true)}
            variant="outline"
            size="sm"
            className="h-8 border-dashed flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Excel&apos;e Aktar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-0">
          <ShareholderFilters table={table} />
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
    <ExcelExportConfirmDialog
      open={excelConfirmOpen}
      onOpenChange={setExcelConfirmOpen}
      onConfirm={() =>
        exportHissedarlarToExcel(table, "hissedarlar", SHAREHOLDER_COLUMN_HEADER_MAP)
      }
    />
    </>
  );
});

HissedarlarTableToolbar.displayName = "HissedarlarTableToolbar";
