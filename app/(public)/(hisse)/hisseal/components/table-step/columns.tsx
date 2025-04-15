"use client";

import { sacrificeSchema } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { Ban, Plus } from "lucide-react";

interface TableMeta {
  onSacrificeSelect: (sacrifice: sacrificeSchema) => void;
}

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    header: "Kurbanlık Sırası",
    cell: ({ row }) => (
      <div className="text-center text-xs sm:text-base py-0.5 sm:py-1">
        {row.getValue("sacrifice_no")}
      </div>
    ),
    filterFn: (row, id, value: string) => {
      const searchValue = value.toLowerCase();
      const cellValue = String(row.getValue(id)).toLowerCase();
      return cellValue.includes(searchValue);
    },
    enableSorting: true,
  },
  {
    accessorKey: "sacrifice_time",
    header: "Kesim Saati",
    cell: ({ row }) => {
      const time = row.getValue("sacrifice_time") as string;
      if (!time) return <div className="text-center py-0.5 sm:py-1">-</div>;

      const [hours, minutes] = time.split(":");
      return (
        <div className="text-center text-xs sm:text-base py-0.5 sm:py-1">
          {`${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "share_price",
    header: "Hisse Bedeli",
    cell: ({ row }) => {
      const share_price = row.getValue("share_price") as number;
      const share_weight = row.original.share_weight;

      return (
        <div className="text-center text-xs sm:text-base py-0.5 sm:py-1 whitespace-nowrap">
          {share_weight} kg. -{" "}
          {new Intl.NumberFormat("tr-TR", {
            style: "decimal",
            maximumFractionDigits: 0,
          }).format(share_price)}{" "}
          TL
        </div>
      );
    },
    filterFn: (row, id, filterValues: (string | number)[]) => {
      if (!filterValues || filterValues.length === 0) return true;

      const rowValue = row.getValue(id) as number;

      return filterValues.some((filterValue: string | number) => {
        const numericFilterValue =
          typeof filterValue === "string"
            ? parseFloat(filterValue)
            : filterValue;
        return rowValue === numericFilterValue;
      });
    },
    enableSorting: true,
  },
  {
    accessorKey: "empty_share",
    header: "Boş Hisse",
    cell: ({ row }) => {
      const emptyShare = row.getValue("empty_share") as number;
      return (
        <div className="text-center py-0.5 sm:py-1">
          <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-md text-xs sm:text-base">
            {emptyShare}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value: (string | number)[]) => {
      return value.includes((row.getValue(id) as number).toString());
    },
    enableSorting: true,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const sacrifice = row.original;
      const emptyShare = sacrifice.empty_share;
      const meta = table.options.meta as TableMeta;

      if (emptyShare === 0) {
        return (
          <div className="flex justify-center py-0.5 sm:py-1">
            <span className="inline-flex items-center justify-center min-w-[80px] sm:min-w-[100px] bg-[#FCEFEF] text-[#D22D2D] px-2 sm:px-4 py-1 sm:py-1.5 rounded text-xs sm:text-base">
              <Ban className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
              Tükendi
            </span>
          </div>
        );
      }

      return (
        <div className="flex justify-center py-0.5 sm:py-1">
          <button
            onClick={() => meta?.onSacrificeSelect(sacrifice)}
            className="inline-flex items-center justify-center min-w-[80px] sm:min-w-[100px] bg-[#F0FBF1] hover:bg-[#22C55E] text-sac-primary font-medium hover:text-white px-2 sm:px-4 py-1 sm:py-1.5 rounded text-xs sm:text-base transition-colors duration-200"
          >
            <Plus className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
            Hisse Al
          </button>
        </div>
      );
    },
  },
];
