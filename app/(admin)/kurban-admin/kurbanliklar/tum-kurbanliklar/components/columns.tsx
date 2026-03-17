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
import { EditableSharePriceCell, EditableEmptyShareCell, EditableNotesCell } from "./columns/EditableSacrificeCells";

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    minSize: 85,
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
    minSize: 90,
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
    cell: ({ row }) => <EditableSharePriceCell row={row} />,
    minSize: 165,
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
    minSize: 85,
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
    cell: ({ row }) => <EditableEmptyShareCell row={row} />,
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
        if (totalAmt <= 0) return "bg-muted-foreground/30";
        if (paid >= totalAmt) return "bg-green-500/70"; // Tam ödeme: yeşil (açık)
        if (paid >= 5000) return "bg-amber-500/70"; // Kapora üstü: sarı (açık)
        return "bg-red-500/70"; // Hisse alındı, kapora yok: kırmızı (açık)
      };

      const totalSlots = 7;
      const filledCount = shareholders.length;
      const emptyCount = totalSlots - filledCount;
      const barHeight = 4; // 2/3 of 6px

      const shareholderBars = (
        <div className="flex items-center gap-1">
          {shareholders.map((s, idx) => {
            const paid = s.paid_amount ?? 0;
            const totalAmt = s.total_amount ?? 0;
            const colorClass = getShareholderColor(paid, totalAmt);
            return (
              <div
                key={s.shareholder_id ?? idx}
                className={cn("w-[22px] flex-shrink-0 rounded-full", colorClass)}
                style={{ height: barHeight }}
                title={s.shareholder_name ?? ""}
              />
            );
          })}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-[22px] flex-shrink-0 rounded-full bg-muted-foreground/30"
              style={{ height: barHeight }}
              title="Boş hisse"
            />
          ))}
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
    minSize: 180,
  },
  {
    accessorKey: "notes",
    header: "Notlar",
    minSize: 280,
    meta: { align: "left" },
    cell: ({ row }) => <EditableNotesCell row={row} />,
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
