"use client";

import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/date-utils";
import { Columns2 } from "lucide-react";

export type ChangeLog = {
  event_id: number;
  table_name: string;
  row_id: string;
  column_name: string;
  old_value: string | null;
  new_value: string | null;
  description: string;
  change_type: "Ekleme" | "Güncelleme" | "Silme";
  changed_at: string;
  change_owner: string | null;
}

export const columns: ColumnDef<ChangeLog>[] = [
  {
    accessorKey: "changed_at",
    header: "Tarih",
    cell: ({ row }) => {
      return (
        <div className="text-center">
          {formatDate(row.getValue("changed_at"))}
        </div>
      );
    },
  },
  {
    accessorKey: "change_type",
    header: "İşlem",
    cell: ({ row }) => {
      const type = row.getValue("change_type") as string;
      return (
        <div className="text-center">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-1 min-w-[90px] justify-center",
              type === "Ekleme" && "bg-sac-primary-lightest text-sac-primary",
              type === "Güncelleme" && "bg-sac-yellow-light text-sac-yellow",
              type === "Silme" && "bg-sac-red-light text-sac-red"
            )}
          >
            {type}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value: unknown) => {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return true;
      return arr.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "table_name",
    header: "Tablo",
    cell: ({ row }) => {
      const tableName = row.getValue("table_name") as string;
      return <div className="text-center">{tableName || "-"}</div>;
    },
    filterFn: (row, id, value: unknown) => {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return true;
      return arr.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "description",
    header: "Açıklama",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="text-left w-full">
          <div className="break-words">{description}</div>
        </div>
      );
    },
    size: 400,
    enableSorting: true,
  },
  {
    accessorKey: "change_owner",
    header: "Son Düzenleyen",
    cell: ({ row }) => {
      const owner = row.getValue("change_owner") as string | null;
      return <div className="text-center">{owner || "-"}</div>;
    },
    filterFn: (row, id, value: unknown) => {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return true;
      return arr.includes(row.getValue(id));
    },
  },
];

export const columnIcon = <Columns2 className="h-4 w-4" />; 