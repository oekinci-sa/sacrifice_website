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
import { cn } from "@/lib/utils";
import { sacrificeSchema } from "@/types";
import { Column, Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PlusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// Filter Badge component for mobile
const FilterCountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs md:hidden">
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
  type: "price" | "share" | "kurbanNo";
}) => {
  if (selectedValues.size === 0) return null;

  // Sort selected values
  const sortedValues = Array.from(selectedValues).sort((a, b) => {
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
                className="bg-[#f4f4f5] text-xs px-2 py-0.5 truncate max-w-[100px]"
                title={option.label}
              >
                {option.label}
              </motion.span>
            ) : null;
          }

          // For other types (share, kurbanNo), use the value directly
          return (
            <motion.span
              key={value}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#f4f4f5] text-xs px-2 py-0.5 truncate max-w-[100px]"
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
  type: "price" | "share" | "kurbanNo";
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
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border rounded-md",
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
  registerResetFunction?: (resetFn: () => void) => void;
}

export function SacrificeFilters({ table, registerResetFunction }: SacrificeFiltersProps) {
  // Add state for "hide filled ones" option
  const [showHideFullOption, setShowHideFullOption] = useState(true);

  // Provide reset function to parent component
  useEffect(() => {
    if (registerResetFunction) {
      registerResetFunction(() => {
        setShowHideFullOption(true);

        // Reset all relevant column filters
        table.getColumn("sacrifice_no")?.setFilterValue(undefined);
        table.getColumn("empty_share")?.setFilterValue(undefined);
        table.getColumn("share_price")?.setFilterValue(undefined);

        // Make sure to check if column exists before trying to reset it
        if (table.getColumn("payment_status")) {
          table.getColumn("payment_status")?.setFilterValue(undefined);
        }
      });
    }
  }, [registerResetFunction, table]);

  // Reset showHideFullOption when column filters are cleared
  useEffect(() => {
    const columnFilters = table.getState().columnFilters;
    const emptyShareFilter = columnFilters.find(f => f.id === "empty_share");

    // If empty_share filter is removed, reset the option to show "Hide filled ones"
    if (!emptyShareFilter) {
      setShowHideFullOption(true);
    }
  }, [table]);

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DataTableFacetedFilter
        column={table.getColumn("sacrifice_no")}
        title="Kurban No"
        options={kurbanNoOptions}
        type="kurbanNo"
      />
      <DataTableFacetedFilter
        column={table.getColumn("share_price")}
        title="Hisse Bedeli"
        options={priceOptions}
        type="price"
      />
      <DataTableFacetedFilter
        column={table.getColumn("empty_share")}
        title="Boş Hisse"
        options={emptyShareOptions}
        type="share"
        showHideFullOption={showHideFullOption}
        setShowHideFullOption={setShowHideFullOption}
      />
    </div>
  );
} 