"use client";

import { ColumnDef } from "@tanstack/react-table";

import { empty_shares, share_prices } from "../data/data";
import { sacrificeSchema } from "../data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    // Görev kimliği.
    accessorKey: "sacrifice_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kurban No" />
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("sacrifice_no")}</div>
    ),
  },
  {
    // Görev başlığı.
    accessorKey: "sacrifice_time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kurban Zamanı" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-center">
            {row.getValue("sacrifice_time")}
        </div>
      );
    },
  },
  {
    // Görev durumu. Filtreleme var.
    accessorKey: "share_price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hisse Bedeli" />
    ),
    cell: ({ row }) => {
      const share_price = share_prices.find(
        (share_price) => share_price.value == row.getValue("share_price")
      );

      if (!share_price) {
        return null;
      }

      return (
        <div className="text-center">
          {share_price.label}
        </div>
      );
    },

    // Filtreleme işlevi.
    filterFn: (row, id, value) => {
      const cellValue = row.getValue(id)?.toString(); // Hücre değerini string'e çevir
      return value.includes(cellValue); // String karşılaştırma yap
    },
  },
  {
    // Görev önceliği.
    accessorKey: "empty_share",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Boş Hisse" />
    ),
    cell: ({ row }) => {
      const empty_share = empty_shares.find(
        (empty_share) => empty_share.value == row.getValue("empty_share")
      );

      if (!empty_share) {
        return null;
      }

      return (
        <div className="text-center">
          <span>{empty_share.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const cellValue = row.getValue(id)?.toString(); // Hücre değerini string'e çevir
      return value.includes(cellValue); // String karşılaştırma yap
    },
  },
  {
    // Görev kimliği.
    accessorKey: "notes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notlar" />
    ),
    cell: ({ row }) => (
      <div className="overflow-hidden">{row.getValue("notes")}</div>
    ),
    size: 800,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
