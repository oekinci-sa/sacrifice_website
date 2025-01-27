"use client";

import { ColumnDef } from "@tanstack/react-table";
import { sacrificeSchema } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(!isSorted)}
          className="h-8 px-2 flex items-center gap-2 hover:bg-muted"
        >
          Kurbanlık No
          {isSorted === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("sacrifice_no")}</div>
    ),
    filterFn: (row, id, value) => {
      const searchValue = value.toLowerCase();
      const cellValue = String(row.getValue(id)).toLowerCase();
      return cellValue.includes(searchValue);
    },
  },
  {
    accessorKey: "sacrifice_time",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(!isSorted)}
          className="h-8 px-2 flex items-center gap-2 hover:bg-muted"
        >
          Kesim Saati
          {isSorted === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const time = row.getValue("sacrifice_time") as string;
      if (!time) return <div className="text-center">-</div>;
      
      const [hours, minutes] = time.split(':');
      return (
        <div className="text-center">
          {`${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`}
        </div>
      );
    },
  },
  {
    accessorKey: "share_price",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 flex items-center gap-2 hover:bg-muted"
        >
          Hisse Bedeli
          {isSorted === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {new Intl.NumberFormat('tr-TR', { 
          style: 'decimal',
          maximumFractionDigits: 0 
        }).format(row.getValue("share_price"))} ₺
      </div>
    ),
    filterFn: (row, id, value) => {
      return value.includes((row.getValue(id) as number).toString());
    },
  },
  {
    accessorKey: "empty_share",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 flex items-center gap-2 hover:bg-muted"
        >
          Boş Hisse
          {isSorted === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const emptyShare = row.getValue("empty_share") as number;
      return (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md font-medium">
            {emptyShare}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes((row.getValue(id) as number).toString());
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const sacrifice = row.original
      const emptyShare = sacrifice.empty_share

      if (emptyShare === 0) {
        return (
          <div className="text-center">
            <span className="bg-[#FCEFEF] text-[#D22D2D] px-2 py-1 rounded text-sm">
              Tükendi
            </span>
          </div>
        )
      }

      return (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => (table.options.meta as any)?.onSacrificeSelect(sacrifice)}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Seç</span>
          </Button>
        </div>
      ) 
    },
  },
]; 