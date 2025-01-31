import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { Table, ColumnFiltersState } from "@tanstack/react-table"
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter"
import { supabase } from "@/utils/supabaseClient"
import { useEffect, useMemo, useState } from "react"

interface ShareFiltersProps {
  table: Table<any>
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
}

export function ShareFilters({ 
  table,
  columnFilters,
  onColumnFiltersChange
}: ShareFiltersProps) {
  const [sharePrices, setSharePrices] = useState<{ label: string; value: string }[]>([])

  const emptyShares = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      label: i.toString(),
      value: i.toString()
    }))
  , []);

  useEffect(() => {
    const fetchSharePrices = async () => {
      const { data: prices } = await supabase
        .from("sacrifice_animals")
        .select("share_price")
        .order("share_price", { ascending: true });

      if (prices) {
        const uniquePrices = Array.from(new Set(prices.map((p) => p.share_price)));
        const options = uniquePrices.map((price) => ({
          label: `${new Intl.NumberFormat('tr-TR', { 
            style: 'decimal',
            maximumFractionDigits: 0 
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
    <div className="flex items-center">
      <Input
        placeholder="Kurbanlık no ile ara..."
        value={(table.getColumn("sacrifice_no")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("sacrifice_no")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      <div className="flex items-center ml-auto space-x-2">
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              // Tüm filtreleri temizle
              table.resetColumnFilters()
              onColumnFiltersChange([])
            }}
            className="h-8 px-2 lg:px-3 flex items-center gap-2 text-sm"
          >
            Tüm filtreleri temizle
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="relative">
          {(table.getColumn("share_price")?.getFilterValue() as string[])?.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {(table.getColumn("share_price")?.getFilterValue() as string[])?.length}
            </div>
          )}
          <DataTableFacetedFilter
            column={table.getColumn("share_price")}
            title="Hisse Bedeli"
            options={sharePrices}
          />
        </div>
        <div className="relative">
          {(table.getColumn("empty_share")?.getFilterValue() as string[])?.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {(table.getColumn("empty_share")?.getFilterValue() as string[])?.length}
            </div>
          )}
          <DataTableFacetedFilter
            column={table.getColumn("empty_share")}
            title="Boş Hisse"
            options={emptyShares}
          />
        </div>
      </div>
    </div>
  )
} 
