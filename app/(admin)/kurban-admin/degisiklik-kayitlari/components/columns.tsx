"use client";

import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
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
  change_owner: string;
}

export const columns: ColumnDef<ChangeLog>[] = [
  {
    accessorKey: "changed_at",
    header: "Tarih",
    cell: ({ row }) => {
      return (
        <div className="text-center">
          {format(new Date(row.getValue("changed_at")), "dd MMM yyyy HH:mm", { locale: tr })}
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
              type === "Ekleme" && "bg-[#F0FBF1] text-[#39C645]",
              type === "Güncelleme" && "bg-[#FFFAEC] text-[#F9BC06]",
              type === "Silme" && "bg-[#FCEFEF] text-[#D22D2D]"
            )}
          >
            {type}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "table_name",
    header: "Tablo",
    cell: ({ row }) => {
      const tableName = row.getValue("table_name") as string;
      const displayName = tableName === "sacrifice_animals"
        ? "Kurbanlıklar"
        : tableName === "shareholders"
          ? "Hissedarlar"
          : tableName;

      return <div className="text-center">{displayName}</div>;
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
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
      return <div className="text-center">{row.getValue("change_owner")}</div>;
    },
  },
];

export const columnIcon = <Columns2 className="h-4 w-4" />; 