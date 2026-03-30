"use client";

import { Button } from "@/components/ui/button";
import { isLiveScaleSacrifice } from "@/lib/live-scale-share";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { sacrificeSchema } from "@/types";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { DataTableFacetedFilter } from "./ShareFilters/DataTableFacetedFilter";
import { FilterCountBadge } from "./ShareFilters/FilterCountBadge";
import { ShareFiltersFallback } from "./ShareFilters/ShareFiltersFallback";

interface ShareFiltersProps {
  table: Table<sacrificeSchema>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
}

function ClientShareFilters({
  table,
  columnFilters,
  onColumnFiltersChange,
}: ShareFiltersProps) {
  const { sacrifices } = useSacrificeStore();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const kurbanNoOptions = useMemo(() => {
    const seen = new Set<number>();
    for (const s of sacrifices) {
      const n = s.sacrifice_no;
      if (typeof n === "number" && !Number.isNaN(n)) seen.add(n);
    }
    return Array.from(seen)
      .sort((a, b) => a - b)
      .map((no) => ({
        label: String(no),
        value: String(no),
      }));
  }, [sacrifices]);

  const sharePrices = useMemo(() => {
    const hasLive = sacrifices.some((s) => isLiveScaleSacrifice(s));

    const priceGroups = sacrifices.reduce((groups, sacrifice) => {
      if (isLiveScaleSacrifice(sacrifice)) return groups;
      const price = sacrifice.share_price;
      if (price == null || Number.isNaN(Number(price))) return groups;
      const p = Number(price);
      if (!groups[p]) {
        groups[p] = [];
      }
      const weight = sacrifice.share_weight;
      if (typeof weight !== "number" || Number.isNaN(weight)) return groups;
      if (!groups[p].includes(weight)) {
        groups[p].push(weight);
      }
      return groups;
    }, {} as Record<number, number[]>);

    const priceOptions = Object.entries(priceGroups)
      .map(([price, weights]) => {
        const numPrice = Number(price);
        const formattedPrice = new Intl.NumberFormat("tr-TR", {
          style: "decimal",
          maximumFractionDigits: 0,
        }).format(numPrice);
        const validWeights = weights.filter(
          (w) => typeof w === "number" && !isNaN(w)
        );
        const weight = validWeights.length > 0 ? Math.min(...validWeights) : 0;

        return {
          label: `${weight} kg. - ${formattedPrice} TL`,
          value: price.toString(),
        };
      })
      .sort((a, b) => Number(a.value) - Number(b.value));

    if (hasLive) {
      return [...priceOptions, { label: "Canlı baskül", value: "live_scale" }];
    }
    return priceOptions;
  }, [sacrifices]);

  const emptyShares = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        label: `${i + 1} veya daha fazla`,
        value: (i + 1).toString(),
      })),
    []
  );

  const isFiltered = columnFilters.length > 0;

  useEffect(() => {
    const handleURLFilters = () => {
      const priceFilter = searchParams.get("price");

      if (priceFilter) {
        try {
          const raw = priceFilter.trim();
          const prices = raw.includes(",")
            ? raw.split(",").map((p) => p.trim())
            : [raw];

          const priceColumn = table.getColumn("share_price");
          if (priceColumn) {
            table.setColumnFilters((prev) => {
              const filtered = prev.filter((f) => f.id !== "share_price");
              return [
                ...filtered,
                {
                  id: "share_price",
                  value: prices,
                },
              ];
            });
          }
        } catch {
          // ignore
        }
      }
    };

    handleURLFilters();
  }, [table, searchParams, pathname]);

  const clearFiltersAndURL = () => {
    table.resetColumnFilters();
    onColumnFiltersChange([]);

    if (searchParams.has("price")) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("price");
      const newURL = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;
      router.push(newURL);
    }
  };

  return (
    <div className="flex flex-col justify-center gap-2 md:gap-4">
      <div className="flex flex-row flex-wrap items-center justify-center gap-2 md:my-4 md:gap-4">
        {[
          {
            column: "sacrifice_no",
            title: "Kurban No",
            options: kurbanNoOptions,
            type: "price" as const,
          },
          {
            column: "share_price",
            title: "Hisse Bedeli",
            options: sharePrices,
            type: "price" as const,
          },
          {
            column: "empty_share",
            title: "Boş Hisse",
            options: emptyShares,
            type: "share" as const,
          },
        ].map(({ column, title, options, type }) => {
          const col = table.getColumn(column);
          return (
            <div key={column} className="relative">
              <FilterCountBadge
                count={(col?.getFilterValue() as string[])?.length || 0}
              />
              <DataTableFacetedFilter
                column={col}
                title={title}
                options={options}
                type={type}
              />
            </div>
          );
        })}
      </div>

      {isFiltered && (
        <div className="flex justify-center md:-mt-4">
          <Button
            variant="ghost"
            onClick={clearFiltersAndURL}
            className="h-8 px-2 lg:px-3 text-sm"
          >
            Tüm filtreleri temizle
            <X className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
          </Button>
        </div>
      )}
      <div className="bg-blue-50 border border-blue-200 text-sm text-center text-blue-800 rounded-md p-2 md:hidden mt-4">
        Tüm tabloyu görmek için sağa kaydırınız.
      </div>
    </div>
  );
}

export function ShareFilters(props: ShareFiltersProps) {
  return (
    <Suspense fallback={<ShareFiltersFallback />}>
      <ClientShareFilters {...props} />
    </Suspense>
  );
}
