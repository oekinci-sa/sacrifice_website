"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Columns2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ChangeLog = {
  event_id: string;
  table_name: string;
  row_id: string;
  column_name: string;
  old_value: string;
  new_value: string;
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
              "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium min-w-[90px] justify-center",
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
    filterFn: (row, id, value) => {
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
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "description",
    header: "Açıklama",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="text-left line-clamp-1"
                data-full-text={description}
                title={description.length > 50 ? description : ""}
              >
                {description}
              </div>
            </TooltipTrigger>
            {description.length > 50 && (
              <TooltipContent className="p-2 max-w-[400px] bg-white">
                <p className="text-sm break-words">{description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "change_owner",
    header: "Kullanıcı",
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue("change_owner")}</div>;
    },
  },
];

export const columnIcon = <Columns2 className="h-4 w-4" />; 