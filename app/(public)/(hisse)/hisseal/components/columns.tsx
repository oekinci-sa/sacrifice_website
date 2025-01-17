"use client";

import { ColumnDef } from "@tanstack/react-table";
import { sacrificeSchema } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(!isSorted)}
          className="w-full"
        >
          Kesim Sırası
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("sacrifice_no")}</div>
    ),
  },
  {
    accessorKey: "sacrifice_time",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(!isSorted)}
          className="w-full"
        >
          Kesim Saati
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
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
          className="w-full"
        >
          Hisse Bedeli
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center">
        {new Intl.NumberFormat('tr-TR', { 
          style: 'currency', 
          currency: 'TRY',
          maximumFractionDigits: 0 
        }).format(row.getValue("share_price"))}
      </div>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id).toString());
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
          className="w-full"
        >
          Boş Hisse
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("empty_share")}</div>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id).toString());
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const sacrifice = row.original;
      return (
        <div className="text-center">
          <Button
            variant="default"
            onClick={() => (table.options.meta as any)?.onSacrificeSelect(sacrifice)}
            disabled={sacrifice.empty_share === 0}
          >
            Hisse Al
          </Button>
        </div>
      );
    },
  },
]; 