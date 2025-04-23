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

  // Always display all selected values regardless of count
  return (
    <div className="hidden md:flex gap-1 ml-2 flex-wrap max-w-[300px]">
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
              className="bg-[#f4f4f5] text-xs px-2 py-0.5 truncate max-w-[100px]"
              title={option.label}
            >
              {option.label}
            </motion.span>
          ) : null;
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
  paymentStatusCounts
}: {
  column?: Column<TData, TValue>;
  title?: string;
  options: { label: string; value: string }[];
  type: string;
  paymentStatusCounts?: Record<string, number>;
}) {
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  const facets = column?.getFacetedUniqueValues();

  const handleSelect = (value: string) => {
    const newSelectedValues = new Set(selectedValues);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      newSelectedValues.add(value);
    }
    const filterValues = Array.from(newSelectedValues);
    column?.setFilterValue(
      filterValues.length ? filterValues : undefined
    );
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
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border rounded-md",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-primary opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{option.label}</span>
                    {type === "payment" ? (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {paymentStatusCounts?.[option.label] || 0}
                      </span>
                    ) : facets?.get(option.value) ? (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
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

interface ShareholderFiltersProps {
  table: Table<shareholderSchema>;
}

export function ShareholderFilters({ table }: ShareholderFiltersProps) {
  // State to store payment status counts
  const [paymentStatusCounts, setPaymentStatusCounts] = useState<Record<string, number>>({});

  // Effect for updating payment status counts
  useEffect(() => {
    const paymentStatusCounts: Record<string, number> = {
      deposit: 0,
      partial: 0,
      completed: 0,
      none: 0
    };

    const filteredRows = table.getFilteredRowModel().rows;

    filteredRows.forEach((row) => {
      const shareholder = row.original;
      if (shareholder.paid_amount === 0) {
        paymentStatusCounts.none++;
      } else if (shareholder.paid_amount >= shareholder.total_amount) {
        paymentStatusCounts.completed++;
      } else if (shareholder.paid_amount >= 5000) {
        paymentStatusCounts.partial++;
      } else {
        paymentStatusCounts.deposit++;
      }
    });

    setPaymentStatusCounts(paymentStatusCounts);
  }, [table]);

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

  // Payment status options with text exactly matching the displayed values - remove "Ödeme Yapılmadı"
  const paymentStatusOptions = useMemo(() => [
    { label: "Tamamlandı", value: "completed" },
    { label: "Tüm Ödeme Bekleniyor", value: "partial" },
    { label: "Kapora Bekleniyor", value: "deposit" }
  ], []);

  // Delivery location options
  const deliveryLocationOptions = {
    "Kesimhane": "Kesimhane",
    "Ulus": "Ulus",
  };

  // Vekalet options
  const vekaletOptions = useMemo(() => [
    { label: "Alındı", value: "true" },
    { label: "Alınmadı", value: "false" }
  ], []);

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
    const sacrificeColumn = table.getColumn("sacrifice_no");
    if (sacrificeColumn) {
      sacrificeColumn.columnDef.filterFn = (row, _id, filterValues) => {
        if (!filterValues || filterValues.length === 0) return true;

        const shareholder = row.original;
        // If sacrifice is null or undefined, return false when filters are active
        if (!shareholder.sacrifice) return false;

        const sacrificeNo = shareholder.sacrifice.sacrifice_no?.toString();
        if (!sacrificeNo) return false;

        return filterValues.includes(sacrificeNo);
      };
    }
  }, [table]);

  // Filter column setup for vekalet
  useEffect(() => {
    const vekaletColumn = table.getColumn("sacrifice_consent");
    if (vekaletColumn) {
      vekaletColumn.columnDef.filterFn = (row, _id, filterValues) => {
        if (!filterValues.length) return true;

        const consent = row.getValue("sacrifice_consent");
        return filterValues.includes(consent ? "true" : "false");
      };
    }
  }, [table]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Always render Kurban No filter first */}
      {table.getColumn("sacrifice_no") && (
        <DataTableFacetedFilter
          column={table.getColumn("sacrifice_no")}
          title="Kurban No"
          options={sacrificeOptions}
          type="sacrifice"
        />
      )}
      {table.getColumn("payment_status") && (
        <DataTableFacetedFilter
          column={table.getColumn("payment_status")}
          title="Ödeme Durumu"
          options={paymentStatusOptions}
          type="payment"
          paymentStatusCounts={paymentStatusCounts}
        />
      )}
      {table.getColumn("delivery_location") && (
        <DataTableFacetedFilter
          column={table.getColumn("delivery_location")}
          title="Teslimat Noktası"
          options={Object.entries(deliveryLocationOptions).map(([label, value]) => ({
            label,
            value,
          }))}
          type="delivery"
        />
      )}
      {table.getColumn("sacrifice_consent") && (
        <DataTableFacetedFilter
          column={table.getColumn("sacrifice_consent")}
          title="Vekalet"
          options={vekaletOptions}
          type="vekalet"
        />
      )}
    </div>
  );
} 