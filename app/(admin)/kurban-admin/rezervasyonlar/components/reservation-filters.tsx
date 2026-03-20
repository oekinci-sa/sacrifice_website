"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Column, Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PlusCircle, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import type { ReservationTransaction } from "./columns";

const FilterCountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <div className="admin-tenant-accent absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs md:hidden">
      {count}
    </div>
  ) : null;

function SelectedFiltersDisplay({
  selectedValues,
  options,
  numericSort,
}: {
  selectedValues: Set<string>;
  options: { label: string; value: string }[];
  numericSort?: boolean;
}) {
  if (selectedValues.size === 0) return null;

  const sortedValues = Array.from(selectedValues).sort((a, b) => {
    if (numericSort) return parseInt(a, 10) - parseInt(b, 10);
    return a.localeCompare(b);
  });

  return (
    <div className="hidden md:flex gap-1 ml-2 flex-wrap max-w-[260px]">
      <AnimatePresence>
        {sortedValues.map((value, index) => {
          const option = options.find((opt) => opt.value === value);
          return option ? (
            <motion.span
              key={value}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: index * 0.05 }}
              className="bg-muted text-xs px-2 py-0.5 truncate max-w-[100px]"
              title={option.label}
            >
              {option.label}
            </motion.span>
          ) : null;
        })}
      </AnimatePresence>
    </div>
  );
}

function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  numericBadges,
}: {
  column?: Column<TData, TValue>;
  title?: string;
  options: { label: string; value: string }[];
  numericBadges?: boolean;
}) {
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  const facets = column?.getFacetedUniqueValues();

  const handleSelect = (value: string) => {
    const next = new Set(selectedValues);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    const filterValues = Array.from(next);
    column?.setFilterValue(filterValues.length ? filterValues : undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed text-xs whitespace-nowrap flex items-center justify-start relative"
        >
          <PlusCircle className="mr-2 h-3 w-3 shrink-0" />
          {title}
          <SelectedFiltersDisplay
            selectedValues={selectedValues}
            options={options}
            numericSort={numericBadges}
          />
          <FilterCountBadge count={selectedValues.size} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-md border",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-primary opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{option.label}</span>
                    {facets?.get(option.value) ? (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center text-xs tabular-nums">
                        {facets.get(option.value)}
                      </span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "Aktif", value: "active" },
  { label: "Tamamlandı", value: "completed" },
  { label: "İptal", value: "canceled" },
  { label: "Zaman Aşımı", value: "timed_out" },
  { label: "Süresi Doldu", value: "expired" },
];

export function ReservationFilters({
  table,
}: {
  table: Table<ReservationTransaction>;
}) {
  const hasFilters = table.getState().columnFilters.length > 0;

  // sacrifice_no: facet değeri string; "-" = kurban atanmamış
  useEffect(() => {
    const col = table.getColumn("sacrifice_no");
    if (col) {
      col.columnDef.filterFn = (row, _id, filterValues: string[] | undefined) => {
        if (!filterValues?.length) return true;
        const raw = row.original.sacrifice_animals?.sacrifice_no;
        const key = raw != null ? String(raw) : "-";
        return filterValues.includes(key);
      };
    }
  }, [table]);

  useEffect(() => {
    const col = table.getColumn("status");
    if (col) {
      col.columnDef.filterFn = (row, _id, filterValues: string[] | undefined) => {
        if (!filterValues?.length) return true;
        return filterValues.includes(row.original.status);
      };
    }
  }, [table]);

  useEffect(() => {
    const col = table.getColumn("share_count");
    if (col) {
      col.columnDef.filterFn = (row, _id, filterValues: string[] | undefined) => {
        if (!filterValues?.length) return true;
        return filterValues.includes(String(row.original.share_count));
      };
    }
  }, [table]);

  const sacrificeOptions = useMemo(() => {
    const nos = new Set<string>();
    table.getPreFilteredRowModel().rows.forEach((row) => {
      const n = row.original.sacrifice_animals?.sacrifice_no;
      if (n != null) nos.add(String(n));
      else nos.add("-");
    });
    const sorted = Array.from(nos).sort((a, b) => {
      if (a === "-") return 1;
      if (b === "-") return -1;
      return parseInt(a, 10) - parseInt(b, 10);
    });
    return sorted.map((v) =>
      v === "-"
        ? { label: "Atanmamış", value: "-" }
        : { label: v, value: v }
    );
  }, [table]);

  const shareCountOptions = useMemo(() => {
    const counts = new Set<string>();
    table.getPreFilteredRowModel().rows.forEach((row) => {
      counts.add(String(row.original.share_count));
    });
    return Array.from(counts)
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      .map((v) => ({ label: `${v} hisse`, value: v }));
  }, [table]);

  const clearFilters = () => {
    table.resetColumnFilters();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {table.getColumn("sacrifice_no") && sacrificeOptions.length > 0 && (
        <DataTableFacetedFilter
          column={table.getColumn("sacrifice_no")}
          title="Kurban No"
          options={sacrificeOptions}
          numericBadges
        />
      )}
      {table.getColumn("share_count") && shareCountOptions.length > 0 && (
        <DataTableFacetedFilter
          column={table.getColumn("share_count")}
          title="Hisse Sayısı"
          options={shareCountOptions}
          numericBadges
        />
      )}
      {table.getColumn("status") && (
        <DataTableFacetedFilter
          column={table.getColumn("status")}
          title="Durum"
          options={STATUS_OPTIONS}
        />
      )}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 px-2 flex items-center gap-1"
        >
          <X className="h-4 w-4 mr-1" />
          Tüm filtreleri temizle
        </Button>
      )}
    </div>
  );
}
