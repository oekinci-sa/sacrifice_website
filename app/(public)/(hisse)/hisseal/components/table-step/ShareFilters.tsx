"use client";

import { Button } from "@/components/ui/button";
import { X, Check, PlusCircle } from "lucide-react";
import { Table, ColumnFiltersState, Column } from "@tanstack/react-table";
import { supabase } from "@/utils/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import { sacrificeSchema } from "@/types";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";

// 🔹 Filtre Badge'i (Sadece mobil için)
const FilterCountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <div className="absolute -top-2 -right-2 bg-sac-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs sm:hidden">
      {count}
    </div>
  ) : null;

// 🔹 Seçili filtreleri gösteren bileşen
const SelectedFiltersDisplay = ({ 
  selectedValues, 
  options, 
  type 
}: { 
  selectedValues: Set<string>,
  options: { label: string; value: string }[],
  type: 'price' | 'share'
}) => {
  if (selectedValues.size === 0) return null;

  // Seçili değerleri sıralayalım
  const sortedValues = Array.from(selectedValues).sort((a, b) => {
    // Sayısal sıralama yapalım
    return parseFloat(a) - parseFloat(b);
  });

  if (type === 'price') {
    if (selectedValues.size <= 3) {
      return (
        <div className="hidden sm:flex gap-1 ml-2">
          <AnimatePresence>
            {sortedValues.map((value, index) => {
              const option = options.find(opt => opt.value === value);
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
        className="hidden sm:inline ml-2 bg-[#f4f4f5] text-xs px-2 py-0.5"
      >
        {selectedValues.size} seçili
      </motion.span>
    );
  }

  // Boş hisse sayısı filtreleri için
  return (
    <div className="hidden sm:flex gap-1 ml-2">
      <AnimatePresence>
        {sortedValues.map((value, index) => (
          <motion.span
            key={value}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#f4f4f5] text-xs px-2 py-0.5"
          >
            {value}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
};

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
  type: 'price' | 'share';
  showHideFullOption?: boolean;
  setShowHideFullOption?: (show: boolean) => void;
}) {
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  const facets = column?.getFacetedUniqueValues();

  const handleHideFullOnes = () => {
    const isCurrentlyHidingFull = selectedValues.has("0") && selectedValues.size === 1;
    
    if (isCurrentlyHidingFull) {
      selectedValues.clear();
      column?.setFilterValue(undefined);
    } else {
      selectedValues.clear();
      options.forEach(option => {
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
          className="h-8 sm:h-10 w-full border text-xs sm:text-sm whitespace-normal sm:whitespace-nowrap flex items-center justify-start"
        >
          <PlusCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
          <span className="mr-auto">{title}</span>
          <SelectedFiltersDisplay 
            selectedValues={selectedValues} 
            options={options}
            type={type}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList className="max-h-full">
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            {type === 'share' && (
              <AnimatePresence>
                {showHideFullOption && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleHideFullOnes}
                        className="flex justify-center font-medium transition-colors data-[highlighted]:bg-transparent hover:text-sac-primary"
                      >
                        Dolu olanları gizle
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                  </motion.div>
                )}
              </AnimatePresence>
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
                          ? "bg-sac-primary border-sac-primary text-primary-foreground" 
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

interface ShareFiltersProps {
  table: Table<sacrificeSchema>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
}

// 🔹 Pay fiyatlarını çekme fonksiyonu
const fetchSharePrices = async () => {
  const { data } = await supabase.from("sacrifice_animals").select("share_price").order("share_price", { ascending: true });

  return data
    ? Array.from(new Set(data.map((p) => p.share_price))).map((price) => ({
        label: `${new Intl.NumberFormat("tr-TR", { style: "decimal", maximumFractionDigits: 0 }).format(price)} TL`,
        value: price.toString(),
      }))
    : [];
};

// 🔹 Ana bileşen
export function ShareFilters({ table, columnFilters, onColumnFiltersChange }: ShareFiltersProps) {
  const [sharePrices, setSharePrices] = useState<{ label: string; value: string }[]>([]);
  const [showHideFullOption, setShowHideFullOption] = useState(true);

  const emptyShares = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({ label: i.toString(), value: i.toString() })),
    []
  );

  useEffect(() => {
    fetchSharePrices().then(setSharePrices);
  }, []);

  const isFiltered = columnFilters.length > 0;

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-center sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
        {[
          { 
            column: "share_price", 
            title: "Hisse Bedeline Göre Filtrele", 
            options: sharePrices,
            type: 'price' as const
          },
          { 
            column: "empty_share", 
            title: "Boş Hisse Sayısına Göre Filtrele", 
            options: emptyShares,
            type: 'share' as const,
            showHideFullOption,
            setShowHideFullOption
          },
        ].map(({ column, title, options, type, ...rest }) => {
          const col = table.getColumn(column);
          return (
            <div key={column} className="relative w-full sm:w-auto">
              <FilterCountBadge count={(col?.getFilterValue() as string[])?.length || 0} />
              <DataTableFacetedFilter 
                column={col} 
                title={title} 
                options={options}
                type={type}
                {...rest}
              />
            </div>
          );
        })}
      </div>
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => {
            table.resetColumnFilters();
            onColumnFiltersChange([]);
            setShowHideFullOption(true);
          }}
          className="h-8 px-2 lg:px-3 text-xs sm:text-sm w-full sm:w-auto"
        >
          Tüm filtreleri temizle
          <X className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
        </Button>
      )}
    </div>
  );
}
