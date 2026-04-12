"use client";

import { ColumnSelectorPopover } from "@/app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/column-selector-popover";
import { Button } from "@/components/ui/button";
import { kurbanliklarColumnHeaderLabels } from "@/lib/admin-table-column-labels/kurbanliklar";
import { exportKurbanliklarToExcel } from "@/lib/excel-export/kurbanliklar-excel";
import { sacrificeSchema } from "@/types";
import { Table } from "@tanstack/react-table";
import { Download, X } from "lucide-react";
import { useState } from "react";
import { ExcelExportConfirmDialog } from "@/components/excel-export/excel-export-confirm-dialog";
import { SacrificeFilters } from "./components/sacrifice-filters";
import { SacrificeSearch } from "./components/sacrifice-search";

interface ToolbarAndFiltersProps {
  table: Table<sacrificeSchema>;
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  onResetColumnLayout?: () => void;
}

const columnHeaderMap = kurbanliklarColumnHeaderLabels;

export function ToolbarAndFilters({
  table,
  columnOrder = [],
  onColumnOrderChange,
  onResetColumnLayout,
}: ToolbarAndFiltersProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [resetVersion, setResetVersion] = useState(0);
  const [excelConfirmOpen, setExcelConfirmOpen] = useState(false);

  /** table referansı sabit kaldığı için useMemo([table]) ile sütun filtreleri donuyordu — her render'da oku. */
  const isFiltered =
    table.getState().columnFilters.length > 0 || globalFilter.trim().length > 0;

  // Handle search - update to only search in notes
  const handleSearch = (value: string) => {
    setGlobalFilter(value);
    table.getColumn("notes")?.setFilterValue(value);
  };

  // Handle reset all filters
  const handleResetFilters = () => {
    table.setColumnFilters([]);
    setGlobalFilter("");
    setResetVersion((prev) => prev + 1);
  };

  return (
    <>
    <div className="flex flex-col gap-3 w-full">
      {/* Üst satır: Search (solda) + Sütunlar + Excel (sağda) - Tüm Hissedarlar ile aynı */}
      <div className="flex items-center justify-between w-full gap-3">
        <SacrificeSearch onSearch={handleSearch} searchValue={globalFilter} placeholder="Notlara göre ara..." className="w-96 sm:w-[28rem] max-w-full min-w-0" />
        <div className="flex items-center gap-2 shrink-0">
          <ColumnSelectorPopover
            table={table}
            columnHeaderMap={columnHeaderMap}
            columnOrder={columnOrder}
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

      {/* Alt satır: Kurban No, Hisse Bilgisi, Boş Hisse filtreleri */}
      <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-0">
          <SacrificeFilters
            table={table}
            resetVersion={resetVersion}
          />
        </div>
        {isFiltered ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 border-dashed gap-1.5 shrink-0 ml-auto"
          >
            <X className="h-4 w-4 shrink-0" />
            Tüm filtreleri temizle
          </Button>
        ) : null}
      </div>
    </div>
    <ExcelExportConfirmDialog
      open={excelConfirmOpen}
      onOpenChange={setExcelConfirmOpen}
      onConfirm={() =>
        exportKurbanliklarToExcel(table, "kurbanliklar", columnHeaderMap)
      }
    />
    </>
  );
}
