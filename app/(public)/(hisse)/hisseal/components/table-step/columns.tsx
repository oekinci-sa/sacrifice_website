"use client";

import { ColumnDef } from "@tanstack/react-table";
import { sacrificeSchema } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Ban } from "lucide-react";

interface TableMeta {
  onSacrificeSelect: (sacrifice: sacrificeSchema) => void;
}

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(!isSorted)}
          className="h-6 sm:h-8 px-1 sm:px-2 flex items-center gap-1 sm:gap-2 hover:bg-muted text-xs sm:text-base"
        >
          <span className="whitespace-normal sm:whitespace-nowrap">
            Kurbanlık<br className="sm:hidden" /> Sırası
          </span>
          {isSorted === "asc" ? (
            <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center text-xs sm:text-base py-0.5 sm:py-1">{row.getValue("sacrifice_no")}</div>
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
          className="h-6 sm:h-8 px-1 sm:px-2 flex items-center gap-1 sm:gap-2 hover:bg-muted text-xs sm:text-base"
        >
          <span className="whitespace-normal sm:whitespace-nowrap">
            Kesim<br className="sm:hidden" /> Saati
          </span>
          {isSorted === "asc" ? (
            <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const time = row.getValue("sacrifice_time") as string;
      if (!time) return <div className="text-center py-0.5 sm:py-1">-</div>;
      
      const [hours, minutes] = time.split(':');
      return (
        <div className="text-center text-xs sm:text-base py-0.5 sm:py-1">
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
          className="h-6 sm:h-8 px-1 sm:px-2 flex items-center gap-1 sm:gap-2 hover:bg-muted text-xs sm:text-base"
        >
          <span className="whitespace-normal sm:whitespace-nowrap">
            Hisse<br className="sm:hidden" /> Bedeli
          </span>
          {isSorted === "asc" ? (
            <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center text-xs sm:text-base py-0.5 sm:py-1">
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
          className="h-6 sm:h-8 px-1 sm:px-2 flex items-center gap-1 sm:gap-2 hover:bg-muted text-xs sm:text-base"
        >
          <span className="whitespace-normal sm:whitespace-nowrap">
            Boş<br className="sm:hidden" /> Hisse
          </span>
          {isSorted === "asc" ? (
            <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </Button>
      );
    },
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
    filterFn: (row, id, value) => {
      return value.includes((row.getValue(id) as number).toString());
    },
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
            className="inline-flex items-center justify-center min-w-[80px] sm:min-w-[100px] bg-[#F0FBF1] hover:bg-[#22C55E] text-[#22C55E] hover:text-white px-2 sm:px-4 py-1 sm:py-1.5 rounded text-xs sm:text-base transition-colors duration-200"
          >
            <Plus className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
            Hisse Al
          </button>
        </div>
      );
    },
  },
]; 