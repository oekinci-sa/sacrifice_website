"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Table, ColumnFiltersState } from "@tanstack/react-table";
import { DataTableFacetedFilter } from "@/app/(public)/(hisse)/hisseal/components/table-step/data-table-faceted-filter";
import { supabase } from "@/utils/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import { sacrificeSchema } from "@/types";

interface ShareFiltersProps {
  table: Table<sacrificeSchema>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
}

export function ShareFilters({
  table,
  columnFilters,
  onColumnFiltersChange,
}: ShareFiltersProps) {
  const [sharePrices, setSharePrices] = useState<
    { label: string; value: string }[]
  >([]);

  const emptyShares = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        label: i.toString(),
        value: i.toString(),
      })),
    []
  );

  useEffect(() => {
    const fetchSharePrices = async () => {
      const { data: prices } = await supabase
        .from("sacrifice_animals")
        .select("share_price")
        .order("share_price", { ascending: true });

      if (prices) {
        const uniquePrices = Array.from(
          new Set(prices.map((p) => p.share_price))
        );
        const options = uniquePrices.map((price) => ({
          label: `${new Intl.NumberFormat("tr-TR", {
            style: "decimal",
            maximumFractionDigits: 0,
          }).format(price)} ₺`,
          value: price.toString(),
        }));
        setSharePrices(options);
      }
    };

    fetchSharePrices();
  }, []);

  const isFiltered = columnFilters.length > 0;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <div className="relative w-full sm:w-auto">
          {(table.getColumn("share_price")?.getFilterValue() as string[])
            ?.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-sac-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {
                (table.getColumn("share_price")?.getFilterValue() as string[])
                  ?.length
              }
            </div>
          )}
          <div className="w-full sm:w-auto">
            <DataTableFacetedFilter
              column={table.getColumn("share_price")}
              title="Hisse Bedeline Göre Filtrele"
              options={sharePrices}
            />
          </div>
        </div>
        <div className="relative w-full sm:w-auto">
          {(table.getColumn("empty_share")?.getFilterValue() as string[])
            ?.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-sac-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {
                (table.getColumn("empty_share")?.getFilterValue() as string[])
                  ?.length
              }
            </div>
          )}
          <div className="w-full sm:w-auto">
            <DataTableFacetedFilter
              column={table.getColumn("empty_share")}
              title="Boş Hisse Sayısına Göre Filtrele"
              options={emptyShares}
            />
          </div>
        </div>
      </div>
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => {
            table.resetColumnFilters();
            onColumnFiltersChange([]);
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
