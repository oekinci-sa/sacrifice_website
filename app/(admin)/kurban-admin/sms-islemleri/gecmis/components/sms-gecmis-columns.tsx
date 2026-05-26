"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SmsTruncatedHoverTip } from "@/components/sms-truncated-hover-tooltip";
import { SmsSendStatusBadge } from "../../components/sms-send-status-badge";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink, RefreshCw, RotateCcw, Trash2, XCircle } from "lucide-react";

export type SmsSendRow = {
  id: string;
  title: string;
  message_content: string | null;
  status: string;
  target_params: Record<string, unknown> | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  excluded_count: number;
  sacrifice_year: number;
  created_by: string;
  created_by_display?: string | null;
  created_at: string;
  completed_at: string | null;
};

export type SmsGecmisMeta = {
  onDetail: (id: string) => void;
  onRetry: (id: string) => void;
  onCancel: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
  retryingId: string | null;
  cancellingId: string | null;
  deletingId: string | null;
  canDelete: boolean;
  /** send ID'leri: başarılı retry ile yeniden denenen orijinal kayıtlar */
  retriedIds: Set<string>;
};

export const smsGecmisColumnHeaderLabels: Record<string, string> = {
  created_at: "Tarih",
  message_content: "Mesaj",
  created_by_display: "Gönderen",
  status: "Durum",
  total_recipients: "Toplam",
  sent_count: "Gönderilen",
  failed_count: "Başarısız",
  excluded_count: "Dışlanan",
  retry_info: "Tekrar Deneme",
  actions: "İşlemler",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("tr-TR");
}

function senderLabel(s: SmsSendRow) {
  return (s.created_by_display && s.created_by_display.trim()) || s.created_by || "—";
}

/** Tarih sütunu genişliği — mesaj sütunu da aynı genişlikte kısaltılır */
const DATE_COL_WIDTH = 140;

const selectColumn: ColumnDef<SmsSendRow, unknown> = {
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Tümünü seç"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Satır seç"
    />
  ),
  enableSorting: false,
  enableHiding: false,
  size: 40,
  minSize: 40,
  maxSize: 40,
};

const smsGecmisDataColumns: ColumnDef<SmsSendRow, unknown>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {smsGecmisColumnHeaderLabels.created_at}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.getValue("created_at"))}
      </span>
    ),
    sortingFn: "datetime",
    size: DATE_COL_WIDTH,
    minSize: DATE_COL_WIDTH,
    maxSize: DATE_COL_WIDTH,
  },
  {
    accessorKey: "message_content",
    header: smsGecmisColumnHeaderLabels.message_content,
    cell: ({ row }) => {
      const text = (row.getValue("message_content") as string | null ?? "").trim();
      const display = text || "—";
      return (
        <div
          className="overflow-hidden text-xs text-muted-foreground"
          style={{ width: DATE_COL_WIDTH, maxWidth: DATE_COL_WIDTH }}
        >
          <SmsTruncatedHoverTip fullText={text}>
            <span className="block truncate">{display}</span>
          </SmsTruncatedHoverTip>
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
    size: DATE_COL_WIDTH,
    minSize: DATE_COL_WIDTH,
    maxSize: DATE_COL_WIDTH,
  },
  {
    accessorKey: "created_by_display",
    accessorFn: (row) => senderLabel(row),
    header: smsGecmisColumnHeaderLabels.created_by_display,
    cell: ({ row }) => {
      const label = senderLabel(row.original);
      return (
        <SmsTruncatedHoverTip fullText={label}>
          <span className="truncate block max-w-[180px] text-sm">{label}</span>
        </SmsTruncatedHoverTip>
      );
    },
  },
  {
    accessorKey: "status",
    header: smsGecmisColumnHeaderLabels.status,
    cell: ({ row }) => (
      <SmsSendStatusBadge status={row.getValue("status")} type="send" />
    ),
  },
  {
    accessorKey: "total_recipients",
    header: () => (
      <span className="block text-right">{smsGecmisColumnHeaderLabels.total_recipients}</span>
    ),
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">{row.getValue("total_recipients")}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "sent_count",
    header: () => (
      <span className="block text-right">{smsGecmisColumnHeaderLabels.sent_count}</span>
    ),
    cell: ({ row }) => (
      <span className="block text-right tabular-nums text-green-600">
        {row.getValue("sent_count")}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "failed_count",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {smsGecmisColumnHeaderLabels.failed_count}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const v = row.getValue("failed_count") as number;
      return (
        <span className={`block text-center tabular-nums ${v > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {v}
        </span>
      );
    },
    meta: { align: "center" },
  },
  {
    accessorKey: "excluded_count",
    header: () => (
      <span className="block text-right">{smsGecmisColumnHeaderLabels.excluded_count}</span>
    ),
    cell: ({ row }) => (
      <span className="block text-right tabular-nums text-muted-foreground">
        {row.getValue("excluded_count")}
      </span>
    ),
    enableSorting: false,
  },
  {
    id: "retry_info",
    header: smsGecmisColumnHeaderLabels.retry_info,
    cell: ({ row, table }) => {
      const meta = table.options.meta as SmsGecmisMeta | undefined;
      const tp = row.original.target_params;
      const retryOf = tp?.retry_of as string | undefined;
      const wasRetried = meta?.retriedIds.has(row.original.id) ?? false;

      if (!retryOf && !wasRetried) return <span className="text-muted-foreground text-xs">—</span>;

      const labels: string[] = [];
      if (retryOf) labels.push("Tekrar Deneme");
      if (wasRetried) labels.push("Tekrar Denildi");

      return (
        <span className="text-sm text-muted-foreground">{labels.join(", ")}</span>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as SmsGecmisMeta | undefined;
      if (!meta) return null;
      const s = row.original;
      const wasRetried = meta.retriedIds.has(s.id);
      const canRetry =
        (s.status === "completed" || s.status === "partial_fail" || s.status === "failed") &&
        (s.failed_count ?? 0) > 0 &&
        !wasRetried;

      return (
        <div className="flex items-center gap-1">
          {s.status === "draft" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={meta.cancellingId === s.id}
              onClick={() => meta.onCancel(s.id, s.title)}
              title="Taslağı iptal et"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
          {meta.canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={meta.deletingId === s.id}
              onClick={() => meta.onDelete(s.id, s.title)}
              title="Kaydı kalıcı sil (süper yönetici)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {canRetry && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              disabled={meta.retryingId === s.id}
              onClick={() => meta.onRetry(s.id)}
              title="Başarısızları Tekrar Dene"
            >
              {meta.retryingId === s.id ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => meta.onDetail(s.id)}
            title="Detayı aç"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    enableSorting: false,
  },
];

export function createSmsGecmisColumns(options?: { enableSelection?: boolean }) {
  if (options?.enableSelection) {
    return [selectColumn, ...smsGecmisDataColumns];
  }
  return smsGecmisDataColumns;
}

/** Geriye dönük uyumluluk — seçim sütunu olmadan */
export const smsGecmisColumns = smsGecmisDataColumns;
