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
      {/* Sol tarafta tek başına Search alanı */}
      <div className="flex">
        <Input
          placeholder="Notlar içinde ara..."
          value={(table.getColumn("notes")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("notes")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[550px]"
        />
      </div>

      {/* Sağ tarafta Hisse Bedeli, Boş Hisse ve Sütunlar butonları */}
      <div className="flex items-center space-x-4">
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
        {table.getColumn("share_price") && (
          <DataTableFacetedFilter
            column={table.getColumn("share_price")}
            title="Hisse Bedeli"
            options={share_prices}
          />
        )}
        {table.getColumn("empty_share") && (
          <DataTableFacetedFilter
            column={table.getColumn("empty_share")}
            title="Boş Hisse"
            options={empty_shares}
          />
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
