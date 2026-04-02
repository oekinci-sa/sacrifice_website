"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { cn } from "@/lib/utils";
import { sacrificeSchema } from "@/types";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { ActionCellContent } from "./columns/ActionCell";
import {
  EditableAnimalTypeCell,
  EditableBarnStallOrderCell,
  EditableEarTagCell,
  EditableEmptyShareCell,
  EditableFoundationCell,
  EditableNotesCell,
  EditablePlannedDeliveryTimeCell,
  EditableSharePriceCell,
} from "./columns/EditableSacrificeCells";

function getEffectiveEarTagSortValue(row: sacrificeSchema): string {
  return (row.ear_tag ?? "").trim();
}

function getEffectiveBarnStallOrderSortValue(row: sacrificeSchema): string {
  return (row.barn_stall_order_no ?? "").trim();
}

function ShareholderBarsCell({ row }: { row: Row<sacrificeSchema> }) {
  const branding = useTenantBranding();
  const depositAmount = branding.deposit_amount;
  const shareholders = row.original.shareholders || [];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + " TL";

  const getShareholderColor = (paid: number, totalAmt: number) => {
    if (totalAmt <= 0) return "bg-muted-foreground/30";
    if (paid >= totalAmt) return "bg-green-500/70";
    if (paid >= depositAmount) return "bg-amber-500/70";
    return "bg-red-500/70";
  };

  const emptyShare = row.original.empty_share ?? 0;
  const totalSlots = emptyShare + shareholders.length;
  const filledCount = shareholders.length;
  const emptyCount = totalSlots - filledCount;
  const barHeight = 4;

  const shareholderBars = totalSlots === 0 ? (
    <span className="text-sm tabular-nums text-muted-foreground">-</span>
  ) : (
    <div className="flex items-center justify-start gap-1 w-full">
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
    </div>
  );

  if (totalSlots === 0 || shareholders.length === 0) {
    return <div className="flex justify-start py-2">{shareholderBars}</div>;
  }

  const rowPairs: { left: typeof shareholders[0]; right?: typeof shareholders[0]; leftIdx: number }[] = [];
  for (let i = 0; i < shareholders.length; i += 2) {
    rowPairs.push({
      left: shareholders[i],
      right: shareholders[i + 1],
      leftIdx: i,
    });
  }

  return (
    <div className="flex justify-start py-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{shareholderBars}</TooltipTrigger>
          <TooltipContent className="p-4 max-w-[90vw] bg-white shadow-lg border">
            <p className="font-semibold text-sm mb-3">Hissedarlar</p>
            <div className="flex flex-col gap-0">
              {rowPairs.map((pair, rowIdx) => {
                const renderCard = (s: (typeof shareholders)[0], idx: number) => {
                  const paid = s.paid_amount ?? 0;
                  const totalAmt = s.total_amount ?? 0;
                  const barNum = idx + 1;
                  return (
                    <div key={s.shareholder_id ?? idx} className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", getShareholderColor(paid, totalAmt))} />
                        <span className="text-sm font-medium truncate">
                          <span className="text-muted-foreground font-normal">{barNum}.</span>{" "}
                          {s.shareholder_name ?? "-"}
                        </span>
                      </div>
                      <div className="grid gap-0.5 text-xs pl-4">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Ödenen</span>
                          <span className="tabular-nums">{formatCurrency(paid)}</span>
                        </div>
                        {paid < totalAmt && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">Kalan</span>
                            <span className="tabular-nums">{formatCurrency(totalAmt - paid)}</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Toplam</span>
                          <span className="tabular-nums">{formatCurrency(totalAmt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                };
                return (
                  <div
                    key={pair.leftIdx}
                    className={cn(
                      "grid grid-cols-2 gap-x-6 gap-y-0 pb-3 mb-3 border-b border-border/60",
                      rowIdx === rowPairs.length - 1 && "border-b-0 pb-0 mb-0"
                    )}
                  >
                    <div className="min-w-0">{renderCard(pair.left, pair.leftIdx)}</div>
                    <div className="min-w-0">
                      {pair.right ? renderCard(pair.right, pair.leftIdx + 1) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export const columns: ColumnDef<sacrificeSchema>[] = [
  {
    accessorKey: "sacrifice_no",
    minSize: 85,
    header: ({ column }) => {
      return (
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="px-0 hover:bg-muted hover:text-foreground"
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
    id: "ear_tag",
    accessorFn: (row) => getEffectiveEarTagSortValue(row),
    minSize: 100,
    header: "Küpe No",
    cell: ({ row }) => <EditableEarTagCell row={row} />,
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "barn_stall_order_no",
    accessorFn: (row) => getEffectiveBarnStallOrderSortValue(row),
    minSize: 110,
    header: "Padok No",
    cell: ({ row }) => <EditableBarnStallOrderCell row={row} />,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "sacrifice_time",
    minSize: 90,
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-muted hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Kesim Saati
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-1 h-4 w-4" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-1 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-1 h-4 w-4" />
        )}
      </Button>
    ),
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
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("sacrifice_time") as string;
      const b = rowB.getValue("sacrifice_time") as string;
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b);
    },
  },
  {
    accessorKey: "planned_delivery_time",
    minSize: 100,
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-muted hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Teslim Saati
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-1 h-4 w-4" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-1 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-1 h-4 w-4" />
        )}
      </Button>
    ),
    cell: ({ row }) => <EditablePlannedDeliveryTimeCell row={row} />,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.planned_delivery_time ?? "";
      const b = rowB.original.planned_delivery_time ?? "";
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b);
    },
  },
  {
    accessorKey: "share_price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="px-0 hover:bg-muted hover:text-foreground"
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
    minSize: 268,
    size: 268,
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
          className="px-0 hover:bg-muted hover:text-foreground"
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
          className="px-0 font-medium hover:bg-muted hover:text-foreground"
        >
          Ödeme Durumu
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
    filterFn: (row, id, value: string) => {
      if (!value) return true;
      const ratio = row.getValue(id) as number;
      if (value === "completed") return ratio >= 100;
      if (value === "incomplete") return ratio < 100;
      return true;
    },
    cell: ({ row }) => (
      <ShareholderBarsCell row={row} />
    ),
    minSize: 180,
  },
  {
    accessorKey: "animal_type",
    header: "Cins",
    minSize: 90,
    cell: ({ row }) => <EditableAnimalTypeCell row={row} />,
    enableSorting: true,
    filterFn: (row, id, filterValues: unknown) => {
      const vals = filterValues as string[] | undefined;
      if (!vals?.length) return true;
      const raw = row.getValue(id) as string | null;
      const key = raw?.trim() ? raw.trim() : "__empty__";
      return vals.includes(key);
    },
  },
  {
    accessorKey: "foundation",
    header: "Referans",
    minSize: 88,
    cell: ({ row }) => <EditableFoundationCell row={row} />,
    enableSorting: true,
    enableHiding: true,
    filterFn: (row, id, filterValues: unknown) => {
      const vals = filterValues as string[] | undefined;
      if (!vals?.length) return true;
      const raw = row.getValue(id) as string | null;
      const key = raw?.trim() ? raw.trim() : "__empty__";
      return vals.includes(key);
    },
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
      const needle = normalizeTurkishSearchText(value.toString());
      if (!needle) return true;
      const notes = normalizeTurkishSearchText(row.getValue(id)?.toString() ?? "");
      return notes.includes(needle);
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
