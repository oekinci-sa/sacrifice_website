"use client";

import { ColumnDef } from "@tanstack/react-table";
import { sacrificeSchema } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center w-full"
      >
        Kesim Sırası
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("sacrifice_no")}</div>
    ),
  },
  {
    accessorKey: "sacrifice_time",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center w-full"
      >
        Kesim Saati
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("sacrifice_time")}</div>
    ),
  },
  {
    accessorKey: "share_price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center w-full"
      >
        Hisse Bedeli
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(row.getValue("share_price"))}
      </div>
    ),
  },
  {
    accessorKey: "empty_share",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center w-full"
      >
        Boş Hisse
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("empty_share")}</div>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const sacrifice = row.original;
      return (
        <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
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