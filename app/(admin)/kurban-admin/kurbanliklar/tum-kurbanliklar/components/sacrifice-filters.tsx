"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { kurbanliklarColumnHeaderLabels as KL } from "@/lib/admin-table-column-labels/kurbanliklar";
import { cn } from "@/lib/utils";
import { sacrificeSchema } from "@/types";
import { Column, Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PlusCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function PaymentStatusFilter({
  table,
  paymentStatusFilter,
  completedCount,
  incompleteCount,
}: {
  table: Table<sacrificeSchema>;
  paymentStatusFilter?: string;
  completedCount: number;
  incompleteCount: number;
}) {
  const column = table.getColumn("payment_status");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed text-xs whitespace-nowrap flex items-center justify-start"
        >
          <PlusCircle className="mr-2 h-3 w-3 shrink-0" />
          {KL.payment_status}
          {paymentStatusFilter && (
            <span className="ml-2 bg-muted text-xs px-1.5 py-0.5 rounded">
              {paymentStatusFilter === "completed" ? "Tamamlananlar" : "Tamamlanmayanlar"}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  const next = paymentStatusFilter === "completed" ? undefined : "completed";
                  column?.setFilterValue(next);
                }}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                    paymentStatusFilter === "completed"
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-primary opacity-50 [&_svg]:invisible"
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <span>Tamamlananlar</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{completedCount}</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  const next = paymentStatusFilter === "incomplete" ? undefined : "incomplete";
                  column?.setFilterValue(next);
                }}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                    paymentStatusFilter === "incomplete"
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-primary opacity-50 [&_svg]:invisible"
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <span>Tamamlanmayanlar</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{incompleteCount}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Filter Badge component for mobile
const FilterCountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <div className="admin-tenant-accent absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs md:hidden">
      {count}
    </div>
  ) : null;

// Component to display selected filters
const SelectedFiltersDisplay = ({
  selectedValues,
  options,
  type,
}: {
  selectedValues: Set<string>;
  options: { label: string; value: string }[];
  type: "price" | "share" | "kurbanNo" | "textFacet";
}) => {
  if (selectedValues.size === 0) return null;

  // Sort selected values
  const sortedValues = Array.from(selectedValues).sort((a, b) => {
    if (type === "textFacet") {
      return a.localeCompare(b, "tr", { sensitivity: "base" });
    }
    return parseFloat(a) - parseFloat(b);
  });

  // Always display all selected values regardless of type or count
  return (
    <div className="hidden md:flex gap-1 ml-2 flex-wrap max-w-[300px]">
      <AnimatePresence>
        {sortedValues.map((value, index) => {
          // For price type, use label from options
          if (type === "price") {
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
          }

          // For other types (share, kurbanNo, textFacet), use the label from options when present
          if (type === "textFacet") {
            const option = options.find((opt) => opt.value === value);
            const label = option?.label ?? value;
            return (
              <motion.span
                key={value}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: index * 0.05 }}
                className="bg-muted text-xs px-2 py-0.5 truncate max-w-[100px]"
                title={label}
              >
                {label}
              </motion.span>
            );
          }

          return (
            <motion.span
              key={value}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: index * 0.05 }}
              className="bg-muted text-xs px-2 py-0.5 truncate max-w-[100px]"
              title={value}
            >
              {value}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Faceted filter component
function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  type,
  showHideFullOption,
  setShowHideFullOption,
}: {
  column?: Column<TData, TValue>;
  title?: string;
  options: { label: string; value: string }[];
  type: "price" | "share" | "kurbanNo" | "textFacet";
  showHideFullOption?: boolean;
  setShowHideFullOption?: (show: boolean) => void;
}) {
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  const facets = column?.getFacetedUniqueValues();

  // Add handler for "Hide filled ones" option
  const handleHideFullOnes = () => {
    // Check if we are currently hiding full ones (only option "0" is selected)
    const isCurrentlyHidingFull =
      selectedValues.has("0") && selectedValues.size === 1;

    if (isCurrentlyHidingFull) {
      // If currently hiding full ones, clear the filter
      selectedValues.clear();
      column?.setFilterValue(undefined);
    } else {
      // If not currently hiding, set filter to all values except "0"
      selectedValues.clear();
      options.forEach((option) => {
        if (option.value !== "0") {
          selectedValues.add(option.value);
        }
      });
      column?.setFilterValue(Array.from(selectedValues));
    }
    setShowHideFullOption?.(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed text-xs whitespace-nowrap flex items-center justify-start"
        >
          <PlusCircle className="mr-2 h-3 w-3 shrink-0" />
          {title}
          <SelectedFiltersDisplay
            selectedValues={selectedValues}
            options={options}
            type={type}
          />
          <FilterCountBadge count={selectedValues.size} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            {/* Add "Hide filled ones" option for empty share filter */}
            {type === "share" && showHideFullOption && (
              <>
                <CommandGroup>
                  <CommandItem
                    onSelect={handleHideFullOnes}
                    className="flex justify-center font-medium transition-colors data-[highlighted]:bg-transparent hover:text-primary"
                  >
                    Dolu olanları gizle
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      );
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-primary opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )}
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

interface SacrificeFiltersProps {
  table: Table<sacrificeSchema>;
  resetVersion?: number;
}

export function SacrificeFilters({ table, resetVersion = 0 }: SacrificeFiltersProps) {
  const searchParams = useSearchParams();
  const urlSyncDone = useRef(false);

  // Add state for "hide filled ones" option
  const [showHideFullOption, setShowHideFullOption] = useState(true);

  // Parent "Tüm filtreleri temizle" butonu: sadece yerel UI durumunu sıfırla.
  useEffect(() => {
    setShowHideFullOption(true);
  }, [resetVersion]);

  // Reset showHideFullOption when column filters are cleared
  const columnFilters = table.getState().columnFilters;
  useEffect(() => {
    const emptyShareFilter = columnFilters.find(f => f.id === "empty_share");

    // If empty_share filter is removed, reset the option to show "Hide filled ones"
    if (!emptyShareFilter) {
      setShowHideFullOption(true);
    }
  }, [columnFilters]);

  // Generate price options from the data
  const priceOptions = useMemo(() => {
    const prices = new Set<number>();

    table.getPreFilteredRowModel().rows.forEach((row) => {
      const price = row.getValue("share_price") as number;
      if (price) prices.add(price);
    });

    return Array.from(prices)
      .sort((a, b) => a - b)
      .map((price) => ({
        label: `${price.toLocaleString("tr-TR")} TL`,
        value: price.toString(),
      }));
  }, [table]);

  // Generate empty share options
  const emptyShareOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i <= 7; i++) {
      options.push({
        label: i.toString(),
        value: i.toString(),
      });
    }
    return options;
  }, []);

  // Generate Kurban No options
  const kurbanNoOptions = useMemo(() => {
    const kurbanNos = new Set<number>();

    table.getPreFilteredRowModel().rows.forEach((row) => {
      const kurbanNo = row.getValue("sacrifice_no") as number;
      if (kurbanNo) kurbanNos.add(kurbanNo);
    });

    return Array.from(kurbanNos)
      .sort((a, b) => a - b)
      .map((kurbanNo) => ({
        label: kurbanNo.toString(),
        value: kurbanNo.toString(),
      }));
  }, [table]);

  const animalTypeOptions = useMemo(() => {
    const map = new Map<string, string>();
    table.getPreFilteredRowModel().rows.forEach((row) => {
      const v = row.getValue("animal_type") as string | null;
      const key = v?.trim() ? v.trim() : "__empty__";
      const label = key === "__empty__" ? "— Boş" : key;
      map.set(key, label);
    });
    return Array.from(map.entries())
      .sort((a, b) => {
        if (a[0] === "__empty__") return -1;
        if (b[0] === "__empty__") return 1;
        return a[0].localeCompare(b[0], "tr", { sensitivity: "base" });
      })
      .map(([value, label]) => ({ value, label }));
  }, [table]);

  const foundationOptions = useMemo(() => {
    const map = new Map<string, string>();
    table.getPreFilteredRowModel().rows.forEach((row) => {
      const v = row.getValue("foundation") as string | null;
      const key = v?.trim() ? v.trim() : "__empty__";
      const label = key === "__empty__" ? "Boş" : key;
      map.set(key, label);
    });
    return Array.from(map.entries())
      .sort((a, b) => {
        if (a[0] === "__empty__") return -1;
        if (b[0] === "__empty__") return 1;
        return a[0].localeCompare(b[0], "tr", { sensitivity: "base" });
      })
      .map(([value, label]) => ({ value, label }));
  }, [table]);

  // Add filter function for Kurban No column
  useEffect(() => {
    const kurbanNoColumn = table.getColumn("sacrifice_no");
    if (kurbanNoColumn) {
      kurbanNoColumn.columnDef.filterFn = (row, id, filterValues: string[]) => {
        if (!filterValues || filterValues.length === 0) return true;

        const rowValue = row.getValue(id) as number;
        const stringValue = rowValue.toString();

        return filterValues.includes(stringValue);
      };
    }
  }, [table]);

  // Genel bakış "Tümünü göster" — ?empty_share= & ?payment_status=
  useEffect(() => {
    if (urlSyncDone.current) return;
    const empty = searchParams.get("empty_share");
    const pay = searchParams.get("payment_status");
    let applied = false;
    if (empty !== null && empty !== "") {
      table.getColumn("empty_share")?.setFilterValue([empty]);
      applied = true;
    }
    if (pay !== null && pay !== "") {
      table.getColumn("payment_status")?.setFilterValue(pay);
      applied = true;
    }
    if (applied) urlSyncDone.current = true;
  }, [table, searchParams]);

  const paymentStatusFilter = table.getColumn("payment_status")?.getFilterValue() as string | undefined;
  const { completedCount, incompleteCount } = useMemo(() => {
    const rows = table.getPreFilteredRowModel().rows;
    let completed = 0;
    let incomplete = 0;
    rows.forEach((row) => {
      const ratio = row.getValue("payment_status") as number;
      if (ratio >= 100) completed++;
      else incomplete++;
    });
    return { completedCount: completed, incompleteCount: incomplete };
  }, [table]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DataTableFacetedFilter
        column={table.getColumn("sacrifice_no")}
        title={KL.sacrifice_no}
        options={kurbanNoOptions}
        type="kurbanNo"
      />
      <DataTableFacetedFilter
        column={table.getColumn("share_price")}
        title={KL.share_price}
        options={priceOptions}
        type="price"
      />
      <DataTableFacetedFilter
        column={table.getColumn("empty_share")}
        title={KL.empty_share}
        options={emptyShareOptions}
        type="share"
        showHideFullOption={showHideFullOption}
        setShowHideFullOption={setShowHideFullOption}
      />
      <DataTableFacetedFilter
        column={table.getColumn("animal_type")}
        title={KL.animal_type}
        options={animalTypeOptions}
        type="textFacet"
      />
      <DataTableFacetedFilter
        column={table.getColumn("foundation")}
        title={KL.foundation}
        options={foundationOptions}
        type="textFacet"
      />
      <PaymentStatusFilter
        table={table}
        paymentStatusFilter={paymentStatusFilter}
        completedCount={completedCount}
        incompleteCount={incompleteCount}
      />
    </div>
  );
} 