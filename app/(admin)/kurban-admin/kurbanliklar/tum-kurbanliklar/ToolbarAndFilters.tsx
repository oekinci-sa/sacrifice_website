"use client";

import { ColumnSelectorPopover } from "@/app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/column-selector-popover";
import { Button } from "@/components/ui/button";
import { exportTableToExcel } from "@/lib/export-to-excel";
import { sacrificeSchema } from "@/types";
import { Table } from "@tanstack/react-table";
import { Download, X } from "lucide-react";
import { useRef, useState } from "react";
import { kurbanliklarColumnHeaderLabels } from "@/lib/admin-table-column-labels/kurbanliklar";
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
  const resetFilterStateRef = useRef<(() => void) | null>(null);

  // Register reset function from child component
  const registerResetFunction = (resetFn: () => void) => {
    resetFilterStateRef.current = resetFn;
  };

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
    table.resetColumnFilters();
    setGlobalFilter("");
    table.getColumn("notes")?.setFilterValue("");
    if (resetFilterStateRef.current) {
      resetFilterStateRef.current();
    }
  };

  const exportToExcel = () => {
    exportTableToExcel(table, "kurbanliklar", columnHeaderMap);
  };

  return (
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
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            className="h-8 border-dashed flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Excel&apos;e Aktar
          </Button>
        </div>
      </div>

      {/* Alt satır: Kurban No, Hisse Bedeli, Boş Hisse filtreleri */}
      <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-0">
          <SacrificeFilters
            table={table}
            registerResetFunction={registerResetFunction}
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
  );
}
