"use client";

import { ColumnDef } from "@tanstack/react-table";

import { labels, empty_shares, share_prices } from "../data/data";
import { Task } from "../data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";

export const columns: ColumnDef<Task>[] = [
  {
    // Görev kimliği.
    accessorKey: "sacrifice_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kurban No" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px]">{row.getValue("sacrifice_no")}</div>
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
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("sacrifice_time")}
          </span>
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
        <div className="flex w-[100px] items-center">
          <span>{share_price.label}</span>
        </div>
      );
    },
    // Filtreleme işlevi.
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
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
        (empty_share) => empty_share.value === row.getValue("empty_share")
      );

      if (!empty_share) {
        return null;
      }

      return (
        <div className="flex items-center">
          <span>{empty_share.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  // {
  //   id: "actions",
  //   cell: ({ row }) => <DataTableRowActions row={row} />,
  // },
];
