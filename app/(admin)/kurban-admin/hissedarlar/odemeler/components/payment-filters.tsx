"use client";

import { useTenantBranding } from "@/hooks/useTenantBranding";
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
import { shareholderSchema } from "@/types";
import { Column, Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PlusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const FilterCountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs md:hidden">
      {count}
    </div>
  ) : null;

const SelectedFiltersDisplay = ({
  selectedValues,
  options,
}: {
  selectedValues: Set<string>;
  options: { label: string; value: string }[];
}) => {
  if (selectedValues.size === 0) return null;
  const sortedValues = Array.from(selectedValues).sort((a, b) => a.localeCompare(b));
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
};

function PaymentStatusFilter({
  column,
  paymentStatusCounts,
}: {
  column: Column<shareholderSchema, unknown>;
  paymentStatusCounts: Record<string, number>;
}) {
  const selectedValues = new Set(column.getFilterValue() as string[]);
  const options = useMemo(
    () => [
      { label: "Tamamlandı", value: "completed" },
      { label: "Tüm Ödeme Bekleniyor", value: "partial" },
      { label: "Kapora Bekleniyor", value: "deposit" },
    ],
    []
  );

  const handleSelect = (value: string) => {
    const newSelectedValues = new Set(selectedValues);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      newSelectedValues.add(value);
    }
    const filterValues = Array.from(newSelectedValues);
    column.setFilterValue(filterValues.length ? filterValues : undefined);
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
          Ödeme Durumu
          <SelectedFiltersDisplay selectedValues={selectedValues} options={options} />
          <FilterCountBadge count={selectedValues.size} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Ödeme Durumu" />
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
                      className={
                        isSelected
                          ? "mr-2 flex h-4 w-4 items-center justify-center rounded-md border bg-primary border-primary text-primary-foreground"
                          : "mr-2 flex h-4 w-4 items-center justify-center rounded-md border border-primary opacity-50 [&_svg]:invisible"
                      }
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{option.label}</span>
                    <span className="ml-auto flex h-4 w-4 items-center justify-center text-xs tabular-nums">
                      {paymentStatusCounts?.[option.value] ?? 0}
                    </span>
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

interface PaymentFiltersProps {
  table: Table<shareholderSchema>;
}

export function PaymentFilters({ table }: PaymentFiltersProps) {
  const branding = useTenantBranding();
  const depositAmount = branding.deposit_amount;
  const [paymentStatusCounts, setPaymentStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const counts: Record<string, number> = {
      deposit: 0,
      partial: 0,
      completed: 0,
    };
    const filteredRows = table.getPreFilteredRowModel().rows;
    filteredRows.forEach((row) => {
      const sh = row.original;
      const paid = Number(sh.paid_amount ?? 0);
      const total = Number(sh.total_amount ?? 0);
      if (total > 0 && paid >= total) {
        counts.completed++;
      } else if (total > 0 && paid >= depositAmount) {
        counts.partial++;
      } else {
        counts.deposit++;
      }
    });
    setPaymentStatusCounts(counts);
  }, [table, depositAmount]);

  useEffect(() => {
    const paymentColumn = table.getColumn("payment_status");
    if (paymentColumn) {
      (paymentColumn.columnDef as { filterFn?: (row: unknown, id: string, filterValues: string[]) => boolean }).filterFn = (
        row,
        _id,
        filterValues
      ) => {
        if (!filterValues?.length) return true;
        const shareholder = (row as { original: shareholderSchema }).original;
        const paid = Number(shareholder.paid_amount ?? 0);
        const total = Number(shareholder.total_amount ?? 0);
        let status: string;
        if (total > 0 && paid >= total) {
          status = "completed";
        } else if (total > 0 && paid >= depositAmount) {
          status = "partial";
        } else {
          status = "deposit";
        }
        return filterValues.includes(status);
      };
    }
  }, [table, depositAmount]);

  const paymentColumn = table.getColumn("payment_status");
  if (!paymentColumn) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PaymentStatusFilter column={paymentColumn} paymentStatusCounts={paymentStatusCounts} />
    </div>
  );
}
