"use client";

import { useTenantBranding } from "@/hooks/useTenantBranding";
import { formatDeliveryOptionLabel, getDeliveryOptions } from "@/lib/delivery-options";
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
import { shareholderSchema } from "@/types";
import { Column, Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PlusCircle } from "lucide-react";
import { useMemo } from "react";

const FilterCountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <div className="admin-tenant-accent absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs md:hidden">
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

function SacrificeNoFilter({
  column,
  options,
}: {
  column: Column<shareholderSchema, unknown>;
  options: { label: string; value: string }[];
}) {
  const selectedValues = new Set((column.getFilterValue() as string[]) ?? []);

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
          Kurbanlık Sırası
          <SelectedFiltersDisplay selectedValues={selectedValues} options={options} />
          <FilterCountBadge count={selectedValues.size} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 max-h-[300px]" align="start">
        <Command>
          <CommandInput placeholder="Kurban no ara" />
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
                          ? "mr-2 flex h-4 w-4 items-center justify-center rounded-md border bg-primary border-primary text-primary-foreground shrink-0"
                          : "mr-2 flex h-4 w-4 items-center justify-center rounded-md border border-primary opacity-50 [&_svg]:invisible shrink-0"
                      }
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{option.label}</span>
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

function DeliveryTypeFilter({
  column,
  options,
}: {
  column: Column<shareholderSchema, unknown>;
  options: { label: string; value: string }[];
}) {
  const selectedValues = new Set((column.getFilterValue() as string[]) ?? []);

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
          Teslimat Tercihi
          <SelectedFiltersDisplay selectedValues={selectedValues} options={options} />
          <FilterCountBadge count={selectedValues.size} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Teslimat tercihi" />
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

function DeliveryLocationFilter({
  column,
  options,
}: {
  column: Column<shareholderSchema, unknown>;
  options: { label: string; value: string }[];
}) {
  const selectedValues = new Set((column.getFilterValue() as string[]) ?? []);

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
          Teslimat Yeri
          <SelectedFiltersDisplay selectedValues={selectedValues} options={options} />
          <FilterCountBadge count={selectedValues.size} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 max-h-[300px]" align="start">
        <Command>
          <CommandInput placeholder="Teslimat yeri ara" />
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
                          ? "mr-2 flex h-4 w-4 items-center justify-center rounded-md border bg-primary border-primary text-primary-foreground shrink-0"
                          : "mr-2 flex h-4 w-4 items-center justify-center rounded-md border border-primary opacity-50 [&_svg]:invisible shrink-0"
                      }
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="truncate block max-w-[220px]" title={option.label}>
                      {option.label}
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

interface TeslimatFiltersProps {
  table: Table<shareholderSchema>;
}

export function TeslimatFilters({ table }: TeslimatFiltersProps) {
  const branding = useTenantBranding();

  const deliveryTypeOptions = useMemo(() => {
    return getDeliveryOptions(branding.logo_slug).map((opt) => ({
      label: formatDeliveryOptionLabel(opt),
      value: opt.value,
    }));
  }, [branding.logo_slug]);

  const deliveryLocationOptions = useMemo(() => {
    const rows = table.getPreFilteredRowModel().rows;
    const seen = new Set<string>();
    const opts: { label: string; value: string }[] = [];
    rows.forEach((row) => {
      const loc = row.original.delivery_location;
      if (loc && !seen.has(loc)) {
        seen.add(loc);
        const display = loc.length > 40 ? loc.slice(0, 40) + "…" : loc;
        opts.push({ label: display, value: loc });
      }
    });
    opts.sort((a, b) => a.label.localeCompare(b.label));
    return opts;
  }, [table]);

  const sacrificeNoOptions = useMemo(() => {
    const rows = table.getPreFilteredRowModel().rows;
    const seen = new Set<string>();
    const opts: { label: string; value: string }[] = [];
    rows.forEach((row) => {
      const no = row.original.sacrifice?.sacrifice_no;
      const key = no != null ? String(no) : null;
      if (key != null && !seen.has(key)) {
        seen.add(key);
        opts.push({ label: key, value: key });
      }
    });
    opts.sort((a, b) => Number(a.value) - Number(b.value));
    return opts;
  }, [table]);

  const sacrificeNoColumn = table.getColumn("sacrifice_no");
  const deliveryTypeColumn = table.getColumn("delivery_type");
  const deliveryLocationColumn = table.getColumn("delivery_location");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sacrificeNoColumn && sacrificeNoOptions.length > 0 && (
        <SacrificeNoFilter column={sacrificeNoColumn} options={sacrificeNoOptions} />
      )}
      {deliveryTypeColumn && (
        <DeliveryTypeFilter column={deliveryTypeColumn} options={deliveryTypeOptions} />
      )}
      {deliveryLocationColumn && deliveryLocationOptions.length > 0 && (
        <DeliveryLocationFilter column={deliveryLocationColumn} options={deliveryLocationOptions} />
      )}
    </div>
  );
}
