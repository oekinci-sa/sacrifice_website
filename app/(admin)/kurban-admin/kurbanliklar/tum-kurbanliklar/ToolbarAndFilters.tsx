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
import { SlidersHorizontal, X } from "lucide-react";
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

  // Handle search
  const handleSearch = (value: string) => {
    setGlobalFilter(value);
    table.setGlobalFilter(value);
  };

  // Handle reset all filters
  const handleResetFilters = () => {
    table.resetColumnFilters();
    setGlobalFilter("");
    table.setGlobalFilter("");

    // Call the reset function if it exists
    if (resetFilterStateRef.current) {
      resetFilterStateRef.current();
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col md:flex-row gap-3 justify-between">
        {/* Search component */}
        <SacrificeSearch onSearch={handleSearch} searchValue={globalFilter} />

        <div className="flex items-center gap-2">
          {/* Reset filters button */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 flex items-center gap-1"
            >
              Tüm filtreleri temizle
              <X className="h-4 w-4 ml-1" />
            </Button>
          )}

          {/* Filter components */}
          <SacrificeFilters
            table={table}
            registerResetFunction={registerResetFunction}
          />

          {/* Columns dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex items-center gap-2"
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
        </div>
      </div>
    </div>
  );
}
