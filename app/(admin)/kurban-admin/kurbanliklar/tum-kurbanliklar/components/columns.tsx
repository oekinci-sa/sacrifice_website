"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sacrificeSchema } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ActionCellContent } from "./columns/ActionCell";

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    header: ({ column }) => {
      return (
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="px-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Kurban No
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-1 h-4 w-4" />
            )}
          </Button>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("sacrifice_no")}
      </div>
    ),
    enableSorting: true,
    filterFn: (row, id, value: string | number) => {
      const rawValue = row.getValue(id) as number;
      const stringValue = String(rawValue);
      if (typeof value === "string") {
        return stringValue.includes(value);
      }
      return false;
    }
  },
  {
    accessorKey: "sacrifice_time",
    header: "Kesim Saati",
    cell: ({ row }) => {
      const time = row.getValue("sacrifice_time") as string;
      if (!time) return <div className="text-center">-</div>;
      try {
        const [hours, minutes] = time.split(':');
        return (
          <div className="text-center">
            {`${hours}:${minutes}`}
          </div>
        );
      } catch {
        return <div className="text-center">-</div>;
      }
    },
    size: 200,
  },
  {
    accessorKey: "share_price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Hisse Bedeli
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-1 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-1 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.getValue("share_price") as number;
      const shareWeight = row.original.share_weight;
      return (
        <div>
          {shareWeight} kg. - {new Intl.NumberFormat("tr-TR", {
            style: "decimal",
            maximumFractionDigits: 0,
          }).format(price)} TL
        </div>
      );
    },
    enableSorting: true,
    filterFn: (row, id, filterValues: (string | number)[]) => {
      if (!filterValues || filterValues.length === 0) return true;
      const rowValue = row.getValue(id) as number;
      return filterValues.some((filterValue: string | number) => {
        const numericFilterValue = typeof filterValue === "string"
          ? parseFloat(filterValue)
          : filterValue;
        return rowValue === numericFilterValue;
      });
    },
  },
  {
    accessorKey: "empty_share",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Boş Hisse
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-1 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-1 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-1 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const empty = row.getValue("empty_share") as number;
      return <div>{empty}</div>;
    },
    enableSorting: true,
    filterFn: (row, id, filterValues: (string | number)[]) => {
      if (!filterValues || filterValues.length === 0) return true;
      const rowValue = row.getValue(id) as number;
      const stringValue = String(rowValue);
      return filterValues.includes(stringValue);
    },
  },
  {
    accessorKey: "payment_status",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="px-0 font-medium"
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
    accessorFn: (row) => {
      const shareholders = row.shareholders || [];
      if (!shareholders.length) return 0;
      const totalPaid = shareholders.reduce((sum, s) => sum + (s.paid_amount || 0), 0);
      const total = shareholders.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      return total > 0 ? Math.floor((totalPaid / total) * 100) : 0;
    },
    cell: ({ row }) => {
      const ratio = row.getValue("payment_status") as number;
      const shareholders = row.original.shareholders || [];
      const totalPaid = shareholders.reduce((sum, s) => sum + (s.paid_amount || 0), 0);
      const total = shareholders.reduce((sum, s) => sum + (s.total_amount || 0), 0);

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount) + ' TL';
      };

      const progressBar = (
        <div className="flex items-center gap-4">
          <Progress
            value={ratio}
            className="min-w-[100px]"
            style={{
              ["--progress-background" as string]: ratio < 50
                ? "var(--sac-red-muted)"
                : ratio < 100
                  ? "var(--sac-yellow-muted)"
                  : "var(--sac-primary-muted)",
              ["--progress-foreground" as string]: ratio < 50
                ? "var(--sac-red)"
                : ratio < 100
                  ? "var(--sac-yellow)"
                  : "var(--sac-primary)",
            } as React.CSSProperties}
          />
          <div
            className={cn(
              "text-sm tabular-nums w-[50px] text-left",
              ratio < 50 ? "text-red-600" : ratio < 100 ? "text-yellow-600" : "text-sac-primary",
            )}
          >
            %{ratio.toString().padStart(3)}
          </div>
        </div>
      );

      return (
        <div className="flex justify-center py-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {progressBar}
              </TooltipTrigger>
              <TooltipContent className="p-4 w-[280px] bg-white">
                <div className="space-y-2">
                  {totalPaid >= total ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sac-primary" />
                        <span className="text-sm text-muted-foreground">Ödeme Tamamlandı:</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(totalPaid)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-sac-primary" />
                          <span className="text-sm text-muted-foreground">Ödenen Tutar:</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-sac-red" />
                          <span className="text-sm text-muted-foreground">Kalan Tutar:</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{formatCurrency(total - totalPaid)}</span>
                      </div>
                      <Separator className="my-2 bg-gray-200" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-sac-muted" />
                          <span className="text-sm text-muted-foreground">Toplam Tutar:</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{formatCurrency(total)}</span>
                      </div>
                    </>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    size: 200,
  },
  {
    accessorKey: "notes",
    header: "Notlar",
    cell: ({ row }) => {
      const notes = row.original.notes || "";
      return (
        <div className="max-w-[200px] truncate" title={notes}>
          {notes || "-"}
        </div>
      );
    },
    size: 200,
    enableSorting: false,
    enableHiding: true,
    filterFn: (row, id, value: string | number) => {
      if (!value) return true;
      const notes = row.getValue(id)?.toString().toLowerCase() || "";
      return notes.includes(value.toString().toLowerCase());
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <ActionCellContent row={row} />,
    size: 200,
    enableSorting: false,
  },
];
