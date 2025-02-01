import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, SlidersHorizontal } from "lucide-react"
import { Table, ColumnFiltersState } from "@tanstack/react-table"
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter"
import { supabase } from "@/utils/supabaseClient"
import { useEffect, useMemo, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ToolbarAndFiltersProps {
  table: Table<any>
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
}

// Column header mapping
const columnHeaderMap: { [key: string]: string } = {
  sacrifice_no: "Kurban No",
  sacrifice_time: "Kesim Saati",
  share_price: "Hisse Bedeli",
  empty_share: "Boş Hisse",
  notes: "Notlar"
};

export function ToolbarAndFilters({ 
  table,
  columnFilters,
  onColumnFiltersChange
}: ToolbarAndFiltersProps) {
  const [sharePrices, setSharePrices] = useState<{ label: string; value: string }[]>([])
  const [sacrificeNos, setSacrificeNos] = useState<{ label: string; value: string }[]>([])

  const emptyShares = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      label: i.toString(),
      value: i.toString()
    }))
  , []);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch share prices
      const { data: prices } = await supabase
        .from("sacrifice_animals")
        .select("share_price")
        .order("share_price", { ascending: true });

      if (prices) {
        const uniquePrices = Array.from(new Set(prices.map((p) => p.share_price)));
        const priceOptions = uniquePrices.map((price) => ({
          label: `${new Intl.NumberFormat('tr-TR', { 
            style: 'decimal',
            maximumFractionDigits: 0 
          }).format(price)} ₺`,
          value: price.toString(),
        }));
        setSharePrices(priceOptions);
      }

      // Fetch sacrifice numbers
      const { data: sacrifices } = await supabase
        .from("sacrifice_animals")
        .select("sacrifice_no")
        .order("sacrifice_no", { ascending: true });

      if (sacrifices) {
        const options = sacrifices.map((s) => ({
          label: s.sacrifice_no,
          value: s.sacrifice_no,
        }));
        setSacrificeNos(options);
      }
    };

    fetchData();
  }, []);

  const isFiltered = columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between gap-4">
      <Input
        placeholder="Notlara göre ara..."
        value={(table.getColumn("notes")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("notes")?.setFilterValue(event.target.value)
        }
        className="max-w-xs"
      />
      <div className="flex items-center gap-4">
        <div className="relative">
          {(table.getColumn("sacrifice_no")?.getFilterValue() as string[])?.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {(table.getColumn("sacrifice_no")?.getFilterValue() as string[])?.length}
            </div>
          )}
          <DataTableFacetedFilter
            column={table.getColumn("sacrifice_no")}
            title="Kurban No"
            options={sacrificeNos}
          />
        </div>
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
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters()
              onColumnFiltersChange([])
            }}
            className="h-8 px-2 lg:px-3 flex items-center gap-2 text-sm"
          >
            Tüm filtreleri temizle
            <X className="h-4 w-4" />
          </Button>
        )}

      </div>
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Sütunlar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" && column.getCanHide()
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {columnHeaderMap[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
    </div>
  )
} 