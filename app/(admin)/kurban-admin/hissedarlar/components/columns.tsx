"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatPhoneForDisplay } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "shareholder_name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full h-full text-base font-medium p-3 rounded-none"
        >
          İsim Soyisim
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
      <div className="text-center py-2 text-sm font-medium">
        {row.getValue("shareholder_name")}
      </div>
    ),
  },
  {
    accessorKey: "phone_number",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full h-full text-base font-medium p-2 rounded-none"
        >
          Telefon
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
      <div className="text-center py-2 text-sm font-medium">
        {formatPhoneForDisplay(row.getValue("phone_number"))}
      </div>
    ),
  },
  {
    accessorKey: "remaining_payment",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full h-full text-base font-medium p-2 rounded-none"
        >
          Kalan Tutar
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
      const amount = parseFloat(row.getValue("remaining_payment"));
      const formatted = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(amount);

      return <div className="text-center py-2 text-sm font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "payment_ratio",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full h-full text-base font-medium p-2 rounded-none"
        >
          Ödeme Oranı
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
      const total = parseFloat(row.original.total_amount);
      const deposit = parseFloat(row.original.paid_amount) || 0;
      const ratio = (deposit / total) * 100;

      let progressBarColor = "";
      let progressBgColor = "";
      
      if (ratio < 25) {
        progressBarColor = "#D22D2D";
        progressBgColor = "#FCEFEF";
      } else if (ratio < 75) {
        progressBarColor = "#F9BC06";
        progressBgColor = "#FFFAEC";
      } else {
        progressBarColor = "#39C645";
        progressBgColor = "#F0FBF1";
      }

      return (
        <div className="flex items-center justify-center gap-2 py-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-[60%]">
                  <Progress 
                    value={ratio} 
                    className="h-2"
                    style={{
                      backgroundColor: progressBgColor,
                      ['--progress-foreground' as string]: progressBarColor
                    } as React.CSSProperties}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  }).format(deposit)} / {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  }).format(total)}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="text-sm font-medium min-w-[40px] text-foreground">
            %{ratio.toFixed(0)}
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const totalA = parseFloat(rowA.original.total_amount);
      const depositA = parseFloat(rowA.original.paid_amount) || 0;
      const ratioA = (depositA / totalA) * 100;

      const totalB = parseFloat(rowB.original.total_amount);
      const depositB = parseFloat(rowB.original.paid_amount) || 0;
      const ratioB = (depositB / totalB) * 100;

      return ratioA - ratioB;
    },
  },
  {
    accessorKey: "delivery_location",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full h-full text-base font-medium p-2 rounded-none"
        >
          Teslimat Noktası
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
      const location = row.getValue("delivery_location");
      let displayLocation = "Kesimhane";
      
      if (location === "yenimahalle-pazar-yeri") {
        displayLocation = "Yenimahalle Pazar Yeri";
      } else if (location === "kecioren-otoparki") {
        displayLocation = "Keçiören Otoparkı";
      }
      
      return (
        <div className="text-center py-2 text-sm font-medium">
          {displayLocation}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "sacrifice_consent",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-full h-full text-base font-medium p-2 rounded-none"
        >
          Vekalet
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
      const sacrifice_consent = row.getValue("sacrifice_consent");

      return (
        <div className="text-center py-2 text-sm font-medium">
          <div className={cn(
            "inline-flex items-center justify-center rounded-md px-2 py-1 min-w-[80px]",
            sacrifice_consent 
              ? "bg-[#F0FBF1] text-[#39C645]" 
              : "bg-[#FCEFEF] text-[#D22D2D]"
          )}>
            {sacrifice_consent ? "Alındı" : "Alınmadı"}
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-center py-2">
        <DataTableRowActions row={row} />
      </div>
    ),
  },
];
