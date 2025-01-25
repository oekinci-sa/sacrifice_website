"use client";

import { ColumnDef } from "@tanstack/react-table";
import { empty_shares, share_prices } from "../data/data";
import { sacrificeSchema } from "@/types";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    header: "Kurban No",
    cell: ({ row }) => <div className="text-center">{row.getValue("sacrifice_no")}</div>,
    size: 200,
  },
  {
    accessorKey: "sacrifice_time",
    header: "Kesim Saati",
    cell: ({ row }) => <div className="text-center">{row.getValue("sacrifice_time")}</div>,
    size: 200,
  },
  {
    accessorKey: "share_price",
    header: "Hisse Bedeli",
    cell: ({ row }) => {
      const share_price = share_prices.find(
        (share_price) => share_price.value == row.getValue("share_price")
      );
      return share_price ? <div className="text-center">{share_price.label}</div> : null;
    },
    filterFn: (row, id, value) => {
      const cellValue = row.getValue(id)?.toString();
      return value.includes(cellValue);
    },
    enableColumnFilter: true,
    size: 200,
  },
  {
    accessorKey: "empty_share",
    header: "Boş Hisse",
    cell: ({ row }) => {
      const empty_share = empty_shares.find(
        (empty_share) => empty_share.value == row.getValue("empty_share")
      );
      return empty_share ? (
        <div className="text-center">
          <span>{empty_share.label}</span>
        </div>
      ) : null;
    },
    filterFn: (row, id, value) => {
      const cellValue = row.getValue(id)?.toString();
      return value.includes(cellValue);
    },
    enableColumnFilter: true,
    size: 200,
  },
  {
    accessorKey: "notes",
    header: "Notlar",
    cell: ({ row }) => <div className="line-clamp-1">{row.getValue("notes")}</div>,
    size: 200,
    enableSorting: false,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <DataTableRowActions row={row} />,
    size: 200,
  },
];
