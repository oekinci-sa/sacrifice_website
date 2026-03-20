"use client";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export type ReservationTransaction = {
  transaction_id: string;
  tenant_id: string;
  sacrifice_year: number;
  sacrifice_id: string | null;
  share_count: number;
  created_at: string;
  expires_at: string | null;
  last_edited_time: string | null;
  /** active → completed | canceled | timed_out | expired geçişinde set edilir */
  completed_at: string | null;
  status: string;
  sacrifice_animals?: { sacrifice_no: number } | null;
  _displayNo?: number;
};

export const columns: ColumnDef<ReservationTransaction>[] = [
  {
    id: "sacrifice_no",
    accessorFn: (row) =>
      row.sacrifice_animals?.sacrifice_no != null
        ? String(row.sacrifice_animals.sacrifice_no)
        : "-",
    header: "Kurban No",
    cell: ({ row }) => {
      const sacrifice = row.original.sacrifice_animals;
      const no = sacrifice?.sacrifice_no;
      return no != null ? <span className="font-medium">{no}</span> : "-";
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.sacrifice_animals?.sacrifice_no ?? -1;
      const b = rowB.original.sacrifice_animals?.sacrifice_no ?? -1;
      return a - b;
    },
  },
  {
    accessorKey: "share_count",
    header: "Hisse Sayısı",
    cell: ({ row }) => row.getValue("share_count"),
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant="secondary"
          className={cn(
            status === "active" && "bg-sac-primary-lightest text-sac-primary",
            status === "completed" && "bg-sac-blue-light text-sac-blue",
            (status === "canceled" || status === "expired" || status === "timed_out") &&
            "bg-sac-red-light text-sac-red"
          )}
        >
          {status === "active"
            ? "Aktif"
            : status === "completed"
              ? "Tamamlandı"
              : status === "canceled"
                ? "İptal"
                : status === "timed_out"
                  ? "Zaman Aşımı"
                  : status === "expired"
                    ? "Süresi Doldu"
                    : status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Oluşturulma",
    cell: ({ row }) => formatDate(row.getValue("created_at")),
  },
  {
    accessorKey: "expires_at",
    header: "Son Geçerlilik",
    cell: ({ row }) => formatDate(row.getValue("expires_at")),
  },
  {
    accessorKey: "completed_at",
    header: "İşlem Bitişi",
    cell: ({ row }) => {
      const status = row.original.status;
      const raw = row.getValue("completed_at") as string | null | undefined;
      if (status === "active" || raw == null || raw === "") {
        return <span className="text-muted-foreground">—</span>;
      }
      return formatDate(raw);
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.completed_at ? new Date(rowA.original.completed_at).getTime() : 0;
      const b = rowB.original.completed_at ? new Date(rowB.original.completed_at).getTime() : 0;
      return a - b;
    },
  },
];
