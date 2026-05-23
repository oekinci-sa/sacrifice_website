"use client";

import { ColumnSelectorPopover } from "@/app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/column-selector-popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";

type Props<TData> = {
  table: Table<TData>;
  columnFilters: ColumnFiltersState;
  columnOrder: string[];
  onColumnOrderChange?: (order: string[]) => void;
  resetColumnLayout?: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchPlaceholder: string;
  columnHeaderMap: Record<string, string>;
  trailing?: React.ReactNode;
};

export function KurbanGunuTableToolbar<TData>({
  table,
  columnFilters,
  columnOrder,
  onColumnOrderChange,
  resetColumnLayout,
  searchTerm,
  setSearchTerm,
  searchPlaceholder,
  columnHeaderMap,
  trailing,
}: Props<TData>) {
  const hasAnyFilter = searchTerm.trim().length > 0 || columnFilters.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
      <div className="relative w-96 max-w-full min-w-0 sm:w-[28rem]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-9"
          aria-label="Tabloda ara"
        />
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {trailing}
        <ColumnSelectorPopover
          table={table}
          columnHeaderMap={columnHeaderMap}
          columnOrder={columnOrder ?? []}
          onColumnOrderChange={onColumnOrderChange}
          onResetColumnLayout={resetColumnLayout}
        />
        {hasAnyFilter ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-dashed gap-1.5 shrink-0"
            onClick={() => {
              setSearchTerm("");
              table.resetColumnFilters();
            }}
          >
            <X className="h-4 w-4 shrink-0" />
            Filtreleri temizle
          </Button>
        ) : null}
      </div>
    </div>
  );
}
