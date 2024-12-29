"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

import { empty_shares, share_prices } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Tablo başlığı için filtreleme alanı. */}
        <Input
          placeholder="Kurbanlık numarasıyla ara..."
          value={
            (table.getColumn("sacrifice_no")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("sacrifice_no")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {/* durum ve öncelik filtreleme yapılır. */}
        {table.getColumn("share_price") && (
          <DataTableFacetedFilter
            column={table.getColumn("share_price")}
            title="Hisse Bedeli"
            options={share_prices}
          />
        )}
        {table.getColumn("empty_share") && (
          // durum ve öncelik filtreleme yapılır.
          <DataTableFacetedFilter
            column={table.getColumn("empty_share")}
            title="Boş Hisse"
            options={empty_shares}
          />
        )}
        {/* // Reset Button */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Sıfırla
            <X />
          </Button>
        )}
      </div>
      {/* Sağ üstteki gözüken dropdown */}
      <DataTableViewOptions table={table} />
    </div>
  );
}
