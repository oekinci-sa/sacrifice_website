"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { Column, Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PlusCircle } from "lucide-react";
import { useEffect, useMemo } from "react";

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
  type: string;
}) => {
  if (selectedValues.size === 0) return null;

  // Sort selected values
  const sortedValues = Array.from(selectedValues).sort((a, b) => {
    if (type === "sacrifice") {
      return parseInt(a) - parseInt(b);
    }
    return a.localeCompare(b);
  });

  if (selectedValues.size <= 3) {
    return (
      <div className="hidden md:flex gap-1 ml-2">
        <AnimatePresence>
          {sortedValues.map((value, index) => {
            const option = options.find((opt) => opt.value === value);
            return option ? (
              <motion.span
                key={value}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#f4f4f5] text-xs px-2 py-0.5"
              >
                {option.label}
              </motion.span>
            ) : null;
          })}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="hidden md:inline ml-2 bg-[#f4f4f5] text-xs px-2 py-0.5"
    >
      {selectedValues.size} seçili
    </motion.span>
  );
};

// Faceted filter component
function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  type,
}: {
  column?: Column<TData, TValue>;
  title?: string;
  options: { label: string; value: string }[];
  type: string;
}) {
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  const facets = column?.getFacetedUniqueValues();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border text-xs whitespace-nowrap flex items-center justify-start"
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

interface ShareholderFiltersProps {
  table: Table<shareholderSchema>;
}

export function ShareholderFilters({ table }: ShareholderFiltersProps) {
  // Generate sacrifice number options from the data
  const sacrificeOptions = useMemo(() => {
    const sacrificeNos = new Set<string>();

    table.getPreFilteredRowModel().rows.forEach((row) => {
      const sacrifice = row.original.sacrifice;
      if (sacrifice?.sacrifice_no) {
        sacrificeNos.add(sacrifice.sacrifice_no.toString());
      }
    });

    return Array.from(sacrificeNos)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((sacrificeNo) => ({
        label: sacrificeNo,
        value: sacrificeNo,
      }));
  }, [table]);

  // Payment status options with text exactly matching the displayed values
  const paymentStatusOptions = useMemo(() => [
    { label: "Tamamlandı", value: "completed" },
    { label: "Tüm Ödeme Bekleniyor", value: "partial" },
    { label: "Kapora Bekleniyor", value: "deposit" },
    { label: "Ödeme Yapılmadı", value: "none" }
  ], []);

  // Delivery location options
  const deliveryLocationOptions = {
    "Kesimhane": "Kesimhane",
    "Ulus": "Ulus",
  };

  // Filter column setup for payment status
  useEffect(() => {
    const paymentColumn = table.getColumn("payment_status");
    if (paymentColumn) {
      paymentColumn.columnDef.filterFn = (row, _id, filterValues) => {
        if (!filterValues.length) return true;

        const shareholder = row.original;
        let status = "none";

        if (!shareholder.total_amount || !shareholder.paid_amount) {
          status = "none";
        } else if (shareholder.paid_amount >= shareholder.total_amount) {
          status = "completed";
        } else if (shareholder.paid_amount >= 5000) {
          status = "partial";
        } else {
          status = "deposit";
        }

        return filterValues.includes(status);
      };
    }
  }, [table]);

  // Filter column setup for sacrifice number
  useEffect(() => {
    const sacrificeColumn = table.getColumn("sacrifice.sacrifice_no");
    if (sacrificeColumn) {
      sacrificeColumn.columnDef.filterFn = (row, _id, filterValues) => {
        if (!filterValues.length) return true;

        const shareholder = row.original;
        const sacrificeNo = shareholder.sacrifice?.sacrifice_no?.toString();

        if (!sacrificeNo) return false;

        return filterValues.includes(sacrificeNo);
      };
    }
  }, [table]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DataTableFacetedFilter
        column={table.getColumn("sacrifice.sacrifice_no")}
        title="Kurban No"
        options={sacrificeOptions}
        type="sacrifice"
      />
      <DataTableFacetedFilter
        column={table.getColumn("payment_status")}
        title="Ödeme Durumu"
        options={paymentStatusOptions}
        type="payment"
      />
      <DataTableFacetedFilter
        column={table.getColumn("delivery_location")}
        title="Teslimat Noktası"
        options={Object.entries(deliveryLocationOptions).map(([label, value]) => ({
          label,
          value,
        }))}
        type="delivery"
      />
    </div>
  );
} 