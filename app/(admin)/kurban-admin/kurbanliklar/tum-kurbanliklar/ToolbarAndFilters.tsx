"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sacrificeSchema } from "@/types";
import { Table } from "@tanstack/react-table";
import { Download, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SacrificeFilters } from "./components/sacrifice-filters";
import { SacrificeSearch } from "./components/sacrifice-search";

interface ToolbarAndFiltersProps {
  table: Table<sacrificeSchema>;
}

// Column header mapping
const columnHeaderMap: { [key: string]: string } = {
  sacrifice_no: "Kurban No",
  sacrifice_time: "Kesim Saati",
  share_price: "Hisse Bedeli",
  empty_share: "Boş Hisse",
  payment_status: "Ödeme Oranı",
  notes: "Notlar",
};

export function ToolbarAndFilters({
  table,
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
    // Reset all column filters
    table.resetColumnFilters();

    // Reset global filter
    setGlobalFilter("");

    // Reset notes column filter specifically
    table.getColumn("notes")?.setFilterValue("");

    // Call the reset function if it exists (for component-specific state)
    if (resetFilterStateRef.current) {
      resetFilterStateRef.current();
    }
  };

  const exportToExcel = () => {
    // Export functionality can be implemented here
    // You'll need to convert the sacrifices data to Excel format
    ("Export to Excel clicked");
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Top row with filters on left and search on right */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        {/* Filter components and reset button */}
        <div className="flex items-center gap-2 flex-wrap">
          <SacrificeFilters
            table={table}
            registerResetFunction={registerResetFunction}
          />

          {/* Reset filters button - visible only when filters are active */}
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

        {/* Search bar on right */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <SacrificeSearch onSearch={handleSearch} searchValue={globalFilter} placeholder="Notlara göre ara..." />
        </div>
      </div>

      {/* Bottom row with column visibility and excel export */}
      <div className="flex justify-end items-center gap-3">
        {/* Columns dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-dashed flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Sütunlar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" && column.getCanHide()
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {columnHeaderMap[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export to Excel button */}
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
  );
}
