"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export type ReservationTransaction = {
  transaction_id: string;
  tenant_id: string;
  sacrifice_id: string | null;
  share_count: number;
  created_at: string;
  expires_at: string | null;
  last_edited_time: string | null;
  status: string;
  sacrifice_animals?: { sacrifice_no: number } | null;
  _displayNo?: number;
};

export const columns: ColumnDef<ReservationTransaction>[] = [
  {
    accessorKey: "_displayNo",
    header: "Rez. No",
    cell: ({ row }) => {
      const no = row.original._displayNo ?? row.index + 1;
      return <span className="font-medium">Rez-{no}</span>;
    },
  },
  {
    accessorKey: "sacrifice_animals",
    header: "Kurban No",
    cell: ({ row }) => {
      const sacrifice = row.original.sacrifice_animals;
      const no = sacrifice?.sacrifice_no;
      return no != null ? <span className="font-medium">{no}</span> : "-";
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
            (status === "canceled" || status === "expired" || status === "timed out") &&
              "bg-sac-red-light text-sac-red"
          )}
        >
          {status === "active"
            ? "Aktif"
            : status === "completed"
              ? "Tamamlandı"
              : status === "canceled"
                ? "İptal"
                : status === "timed out"
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
];
