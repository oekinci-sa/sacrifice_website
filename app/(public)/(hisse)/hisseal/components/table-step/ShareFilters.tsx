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
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { sacrificeSchema } from "@/types";
import { Column, ColumnFiltersState, Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PlusCircle, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

// 🔹 Filtre Badge'i (Sadece mobil için)
const FilterCountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <div className="absolute -top-2 -right-2 bg-sac-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs md:hidden">
      {count}
    </div>
  ) : null;

// 🔹 Seçili filtreleri gösteren bileşen
const SelectedFiltersDisplay = ({
  selectedValues,
  options,
  type,
}: {
  selectedValues: Set<string>;
  options: { label: string; value: string }[];
  type: "price" | "share";
}) => {
  if (selectedValues.size === 0) return null;

  // Seçili değerleri sıralayalım
  const sortedValues = Array.from(selectedValues).sort((a, b) => {
    // Sayısal sıralama yapalım
    return parseFloat(a) - parseFloat(b);
  });

  if (type === "price") {
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
  }

  // Boş hisse sayısı filtreleri için
  return (
    <div className="hidden md:flex gap-1 ml-2">
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
  type: "price" | "share";
  showHideFullOption?: boolean;
  setShowHideFullOption?: (show: boolean) => void;
}) {
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  const facets = column?.getFacetedUniqueValues();

  const handleHideFullOnes = () => {
    const isCurrentlyHidingFull =
      selectedValues.has("0") && selectedValues.size === 1;

    if (isCurrentlyHidingFull) {
      selectedValues.clear();
      column?.setFilterValue(undefined);
    } else {
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
          className="h-8 md:h-10 w-full border text-xs md:text-sm whitespace-normal md:whitespace-nowrap flex items-center justify-start"
        >
          <PlusCircle className="mr-2 h-3 w-3 md:h-4 md:w-4 shrink-0" />
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
            {type === "share" && (
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

// 🔹 Client-side fonksiyonları içeren bileşen
function ClientShareFilters({
  table,
  columnFilters,
  onColumnFiltersChange,
}: ShareFiltersProps) {
  const { sacrifices } = useSacrificeStore();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Updated sharePrices to include weight information
  const sharePrices = useMemo(() => {
    // First, let's log a sample sacrifice to see its structure
    if (sacrifices.length > 0) {
      console.log("Sample sacrifice:", sacrifices[0]);
    }

    // Create a map to group sacrifices by price
    const priceGroups = sacrifices.reduce((groups, sacrifice) => {
      const price = sacrifice.share_price;
      if (!groups[price]) {
        groups[price] = [];
      }

      // Use the correct property for weight
      // Replace 'weight_kg' with the actual property name
      const weight = sacrifice.share_weight;

      // Only add unique weights
      if (!groups[price].includes(weight)) {
        groups[price].push(weight);
      }
      return groups;
    }, {} as Record<number, number[]>);

    // Convert to options format with weight and price
    const priceOptions = Object.entries(priceGroups)
      .map(([price, weights]) => {
        const numPrice = Number(price);
        const formattedPrice = new Intl.NumberFormat("tr-TR", {
          style: "decimal",
          maximumFractionDigits: 0,
        }).format(numPrice);

        // If there are multiple weights for this price, use the min weight
        // Make sure we have valid weights
        const validWeights = weights.filter(
          (w) => typeof w === "number" && !isNaN(w)
        );
        const weight = validWeights.length > 0 ? Math.min(...validWeights) : 0; // Default to 0 if no valid weights

        return {
          label: `${weight} kg. - ${formattedPrice} TL`,
          value: price.toString(), // Ensure this is a string for consistency
        };
      })
      .sort((a, b) => Number(a.value) - Number(b.value));

    return priceOptions;
  }, [sacrifices]);

  // Varsayılan olarak tüm filtreleri görüntüleyeceğiz
  const [showPriceFilters, setShowPriceFilters] = useState(true);
  const [showShareFilters, setShowShareFilters] = useState(true);

  // Özel "dolmuş kurbanları gizle" seçeneğini gösterip göstermeyeceğimizi belirleyen durum
  const [showHideFullOption, setShowHideFullOption] = useState(false);

  // Sayfa açıldığında URL'deki parametrelere göre filtreleri ayarla
  useEffect(() => {
    // URL'deki filtreleri kontrol et
    handleURLFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL'deki parametrelere göre filtreleri ayarlayan fonksiyon
  const handleURLFilters = () => {
    if (!searchParams) return;

    const priceParam = searchParams.get("price");
    const shareParam = searchParams.get("share");

    if (priceParam) {
      // URL'den gelen fiyat filtrelerini ayarla
      const priceValues = priceParam.split(",");
      table.getColumn("share_price")?.setFilterValue(priceValues);
    }

    if (shareParam) {
      // URL'den gelen boş hisse filtrelerini ayarla
      const shareValues = shareParam.split(",");
      table.getColumn("empty_share")?.setFilterValue(shareValues);
    }
  };

  // Fiyat aralığı seçeneklerini oluştur - bu statik olacak
  const priceOptions = useMemo(
    () => [
      { label: "4.000₺", value: "4000" },
      { label: "5.000₺", value: "5000" },
      { label: "5.500₺", value: "5500" },
      { label: "6.000₺", value: "6000" },
      { label: "7.000₺", value: "7000" },
    ],
    []
  );

  // Boş hisse sayısı seçeneklerini dinamik olarak oluştur
  const shareOptions = useMemo(() => {
    // Kurbanların boş hisse sayılarını toplayalım
    const shareCounts = new Set<number>();

    if (sacrifices && sacrifices.length > 0) {
      sacrifices.forEach((sacrifice) => {
        if (
          typeof sacrifice.empty_share === "number" &&
          sacrifice.empty_share >= 0
        ) {
          shareCounts.add(sacrifice.empty_share);
        }
      });
    }

    // Sıralı bir dizi oluşturalım ve her değer için bir seçenek oluşturalım
    return Array.from(shareCounts)
      .sort((a, b) => a - b)
      .map((count) => ({
        label: count === 0 ? "0 (Dolu)" : count.toString(),
        value: count.toString(),
      }));
  }, [sacrifices]);

  // Aktif filtre sayısını hesapla
  const activeFilterCount =
    (table.getColumn("share_price")?.getFilterValue() ? 1 : 0) +
    (table.getColumn("empty_share")?.getFilterValue() ? 1 : 0);

  // Tüm filtreleri temizle
  const handleResetFilters = () => {
    table.resetColumnFilters();
  };

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <div className="relative flex flex-1 items-center gap-2">
        {/* Fiyat filtresi */}
        {showPriceFilters && (
          <div className="w-full md:w-auto">
            <DataTableFacetedFilter
              column={table.getColumn("share_price")}
              title="Fiyat Aralığı"
              options={priceOptions}
              type="price"
            />
          </div>
        )}

        {/* Boş hisse filtresi */}
        {showShareFilters && (
          <div className="w-full md:w-auto">
            <DataTableFacetedFilter
              column={table.getColumn("empty_share")}
              title="Boş Hisse Sayısı"
              options={shareOptions}
              type="share"
              showHideFullOption={showHideFullOption}
              setShowHideFullOption={setShowHideFullOption}
            />
          </div>
        )}

        {/* Filtre temizleme butonu - yalnızca aktif filtre varsa göster */}
        {activeFilterCount > 0 && (
          <div className="hidden md:block ml-auto">
            <Button
              variant="ghost"
              onClick={handleResetFilters}
              className="h-8 px-2 lg:px-3 text-xs md:text-sm"
            >
              Filtreleri temizle
              <X className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Mobil için filtre temizleme butonu */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="ml-auto md:hidden h-8 w-8 p-0 focus-visible:ring-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Filtreleri temizle</span>
          </Button>
        )}
      </div>
    </div>
  );
}

// 🔹 Ana bileşen - Suspense ile sarılmış
export function ShareFilters(props: ShareFiltersProps) {
  return (
    <Suspense fallback={<div className="h-8 w-full bg-gray-100 animate-pulse rounded-md"></div>}>
      <ClientShareFilters {...props} />
    </Suspense>
  );
}
