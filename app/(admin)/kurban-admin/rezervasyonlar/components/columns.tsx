"use client";

import { Badge } from "@/components/ui/badge";
import { clientDeviceCategoryLabel } from "@/lib/client-device-category";
import { formatDateWithSeconds } from "@/lib/date-utils";
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
  last_heartbeat_at?: string | null;
  client_device_category?: string | null;
  status: string;
  sacrifice_animals?: { sacrifice_no: number } | null;
  _displayNo?: number;
};

export const REZERVASYONLAR_COLUMN_HEADER_MAP: Record<string, string> = {
  transaction_id: "Rezervasyon No",
  sacrifice_no: "Kurban No",
  share_count: "Hisse Sayısı",
  status: "Durum",
  created_at: "Oluşturulma",
  completed_at: "Tamamlandı",
  last_heartbeat_at: "Son Bağlantı",
  expires_at: "Son Geçerlilik",
  client_device_category: "Cihaz",
};

export const columns: ColumnDef<ReservationTransaction>[] = [
  {
    id: "transaction_id",
    accessorKey: "transaction_id",
    header: "Rezervasyon No",
    cell: ({ row }) => (
      <span className="font-medium break-all">
        {row.original.transaction_id}
      </span>
    ),
    enableSorting: true,
    sortingFn: (rowA, rowB) =>
      rowA.original.transaction_id.localeCompare(rowB.original.transaction_id),
  },
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
    id: "client_device_category",
    accessorKey: "client_device_category",
    accessorFn: (row) =>
      clientDeviceCategoryLabel(row.client_device_category ?? "unknown"),
    header: "Cihaz",
    cell: ({ row }) => {
      const raw = row.original.client_device_category ?? "unknown";
      return (
        <span className="text-sm">{clientDeviceCategoryLabel(raw)}</span>
      );
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = String(rowA.original.client_device_category ?? "unknown");
      const b = String(rowB.original.client_device_category ?? "unknown");
      return a.localeCompare(b, "tr");
    },
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
            (status === "canceled" ||
              status === "expired" ||
              status === "timed_out" ||
              status === "offline") &&
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
                    : status === "offline"
                      ? "Çevrimdışı"
                      : status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Oluşturulma",
    cell: ({ row }) => formatDateWithSeconds(row.getValue("created_at")),
  },
  {
    accessorKey: "completed_at",
    header: "Tamamlandı",
    cell: ({ row }) => {
      const status = row.original.status;
      const raw = row.getValue("completed_at") as string | null | undefined;
      if (status === "active") {
        return (
          <span className="text-muted-foreground">
            Henüz İşlem Tamamlanmadı
          </span>
        );
      }
      if (raw == null || raw === "") {
        return <span className="text-muted-foreground">—</span>;
      }
      return formatDateWithSeconds(raw);
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.completed_at
        ? new Date(rowA.original.completed_at).getTime()
        : 0;
      const b = rowB.original.completed_at
        ? new Date(rowB.original.completed_at).getTime()
        : 0;
      return a - b;
    },
  },
  {
    accessorKey: "last_heartbeat_at",
    header: "Son Bağlantı",
    cell: ({ row }) => {
      const status = row.original.status;
      const raw = row.original.last_heartbeat_at;
      if (status === "active") {
        if (raw == null || raw === "") {
          return (
            <span className="text-muted-foreground">Henüz bağlantı yok</span>
          );
        }
        return <span>{formatDateWithSeconds(raw)}</span>;
      }
      if (raw == null || raw === "") {
        return <span className="text-muted-foreground">—</span>;
      }
      return formatDateWithSeconds(raw);
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.last_heartbeat_at
        ? new Date(rowA.original.last_heartbeat_at).getTime()
        : 0;
      const b = rowB.original.last_heartbeat_at
        ? new Date(rowB.original.last_heartbeat_at).getTime()
        : 0;
      return a - b;
    },
  },
  {
    accessorKey: "expires_at",
    header: "Son Geçerlilik",
    cell: ({ row }) => formatDateWithSeconds(row.getValue("expires_at")),
  },
];
