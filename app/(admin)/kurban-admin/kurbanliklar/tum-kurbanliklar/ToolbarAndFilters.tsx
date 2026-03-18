"use client";

import { ColumnSelectorPopover } from "@/app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/column-selector-popover";
import { Button } from "@/components/ui/button";
import { exportTableToExcel } from "@/lib/export-to-excel";
import { sacrificeSchema } from "@/types";
import { Table } from "@tanstack/react-table";
import { Download, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SacrificeFilters } from "./components/sacrifice-filters";
import { SacrificeSearch } from "./components/sacrifice-search";

interface ToolbarAndFiltersProps {
  table: Table<sacrificeSchema>;
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
}

// Column header mapping
const columnHeaderMap: { [key: string]: string } = {
  sacrifice_no: "Kurban No",
  sacrifice_time: "Kesim Saati",
  share_price: "Hisse Bedeli",
  empty_share: "Boş Hisse",
  payment_status: "Ödeme Durumu",
  notes: "Notlar",
};

export function ToolbarAndFilters({
  table,
  columnOrder = [],
  onColumnOrderChange,
}: ToolbarAndFiltersProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const resetFilterStateRef = useRef<(() => void) | null>(null);

  // Register reset function from child component
  const registerResetFunction = (resetFn: () => void) => {
    resetFilterStateRef.current = resetFn;
  };

  // Memoize the column filters to avoid complex expressions in dependency array
  const columnFilters = useMemo(() =>
    table.getState().columnFilters,
    [table]
  );

  // Check if any filters are active
  useEffect(() => {
    const hasColumnFilters = columnFilters.length > 0;
    const hasGlobalFilter = globalFilter.trim().length > 0;
    setIsFiltered(hasColumnFilters || hasGlobalFilter);
  }, [columnFilters, globalFilter]);

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
      <div className="flex items-center gap-3 flex-wrap">
        <SacrificeFilters
          table={table}
          registerResetFunction={registerResetFunction}
        />
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 px-2 flex items-center gap-1"
          >
            <X className="h-4 w-4 mr-1" />
            Tüm filtreleri temizle
          </Button>
        )}
      </div>
    </div>
  );
}
