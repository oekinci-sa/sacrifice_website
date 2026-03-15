"use client";

import { Button } from "@/components/ui/button";
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

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount) + ' TL';
      };

      const getShareholderColor = (paid: number, totalAmt: number) => {
        if (totalAmt <= 0) return "bg-muted";
        if (paid >= totalAmt) return "bg-sac-primary";
        if (paid >= 5000) return "bg-sac-yellow";
        return "bg-sac-red";
      };

      const shareholderBars = (
        <div className="flex items-center gap-1">
          {shareholders.map((s, idx) => {
            const paid = s.paid_amount ?? 0;
            const totalAmt = s.total_amount ?? 0;
            const colorClass = getShareholderColor(paid, totalAmt);
            return (
              <div
                key={s.shareholder_id ?? idx}
                className={cn("w-[15px] h-[3.75px] rounded-lg flex-shrink-0", colorClass)}
                title={s.shareholder_name ?? ""}
              />
            );
          })}
          <span
            className={cn(
              "text-sm tabular-nums ml-2 min-w-[42px]",
              ratio < 50 ? "text-red-600" : ratio < 100 ? "text-yellow-600" : "text-sac-primary",
            )}
          >
            %{ratio.toString().padStart(3)}
          </span>
        </div>
      );

      return (
        <div className="flex justify-center py-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {shareholderBars}
              </TooltipTrigger>
              <TooltipContent className="p-4 w-[300px] max-h-[320px] overflow-y-auto bg-white shadow-lg border">
                <div className="space-y-3">
                  <p className="font-semibold text-sm">Hissedarlar</p>
                  {shareholders.map((s, idx) => {
                    const paid = s.paid_amount ?? 0;
                    const totalAmt = s.total_amount ?? 0;
                    return (
                      <div key={s.shareholder_id ?? idx} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full shrink-0", getShareholderColor(s.paid_amount ?? 0, s.total_amount ?? 0))} />
                          <span className="text-sm font-medium truncate">{s.shareholder_name ?? "-"}</span>
                        </div>
                        <div className="grid gap-1 text-xs pl-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ödenen</span>
                            <span className="tabular-nums">{formatCurrency(paid)}</span>
                          </div>
                          {paid < totalAmt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Kalan</span>
                              <span className="tabular-nums">{formatCurrency(totalAmt - paid)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Toplam</span>
                            <span className="tabular-nums">{formatCurrency(totalAmt)}</span>
                          </div>
                        </div>
                        {idx < shareholders.length - 1 && <Separator className="my-2" />}
                      </div>
                    );
                  })}
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
