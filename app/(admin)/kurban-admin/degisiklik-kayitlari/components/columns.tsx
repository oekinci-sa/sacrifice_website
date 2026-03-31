"use client";

import { formatDate } from "@/lib/date-utils";
import {
  formatRowIdDisplay,
  getColumnLabelTr,
  getTableLabelTr,
  tableNameMatchesFilter,
} from "@/lib/change-log-labels";
import { cn } from "@/lib/utils";
import {
  Content,
  Portal,
  Provider as RadixTooltipProvider,
  Root as TooltipRoot,
  Trigger as TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Columns2 } from "lucide-react";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

export type ChangeLog = {
  event_id: number;
  table_name: string;
  row_id: string;
  column_name: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string;
  change_type: "Ekleme" | "Güncelleme" | "Silme";
  changed_at: string;
  change_owner: string | null;
  correlation_id: string | null;
  log_layer: string | null;
  sacrifice_year: number | null;
};

// ---------------------------------------------------------------------------
// Truncate + Tooltip (mevcut TruncatedDescriptionCell'in genelleştirilmiş hali)
// ---------------------------------------------------------------------------
function TruncatedCell({
  text,
  maxWidth = "max-w-[28rem]",
}: {
  text: string;
  maxWidth?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const node = ref.current;
      if (!node) return;
      setTruncated(node.scrollWidth > node.clientWidth + 1);
    };

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(measure);
    });

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [text]);

  const lineClass = `block w-full ${maxWidth} min-w-0 truncate text-left`;

  const inner = (
    <div ref={ref} className={cn(lineClass, truncated && "cursor-default")}>
      {text}
    </div>
  );

  if (!truncated) {
    return <div className={`min-w-0 ${maxWidth}`}>{inner}</div>;
  }

  return (
    <div className={`min-w-0 ${maxWidth}`}>
      <TooltipRoot delayDuration={200}>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <Portal>
          <Content
            side="bottom"
            align="start"
            sideOffset={6}
            className={cn(
              "z-50 max-w-md animate-in fade-in-0 zoom-in-95",
              "rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
              "whitespace-pre-wrap text-left"
            )}
          >
            {text}
          </Content>
        </Portal>
      </TooltipRoot>
    </div>
  );
}

// ---------------------------------------------------------------------------
// İşlem tipi rozeti
// ---------------------------------------------------------------------------
function ChangeTypeCell({ row }: { row: Row<ChangeLog> }) {
  const type = row.getValue("change_type") as string;

  return (
    <div className="text-center">
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-1 min-w-[90px] justify-center text-xs font-semibold",
          type === "Ekleme" && "bg-muted text-muted-foreground",
          type === "Güncelleme" && "bg-sac-yellow-light text-sac-yellow",
          type === "Silme" && "bg-sac-red-light text-sac-red"
        )}
      >
        {type}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Açılır detay paneli
// ---------------------------------------------------------------------------
function ExpandedDetailPanel({ log }: { log: ChangeLog }) {
  const items: { label: string; value: ReactNode }[] = [
    { label: "Kaynak Tablo", value: getTableLabelTr(log.table_name) },
    {
      label: "Kayıt",
      value: formatRowIdDisplay(log.table_name, log.row_id ?? ""),
    },
    {
      label: "Alan",
      value: getColumnLabelTr(log.table_name, log.column_name),
    },
    {
      label: "Eski Değer",
      value: log.old_value != null ? log.old_value : "-",
    },
    {
      label: "Yeni Değer",
      value: log.new_value != null ? log.new_value : "-",
    },
    {
      label: "Açıklama",
      value: <span className="whitespace-pre-wrap">{log.description}</span>,
    },
    ...(log.correlation_id
      ? [
          {
            label: "İlişki ID",
            value: (
              <span className="font-mono text-xs text-muted-foreground">
                {log.correlation_id}
              </span>
            ),
          },
          {
            label: "Katman",
            value: log.log_layer === "primary" ? "Ana kayıt" : log.log_layer === "detail" ? "Detay kayıt" : log.log_layer ?? "-",
          },
        ]
      : []),
    ...(log.sacrifice_year
      ? [{ label: "Kurban Yılı", value: String(log.sacrifice_year) }]
      : []),
    { label: "Olay ID", value: String(log.event_id) },
  ];

  return (
    <tr>
      <td colSpan={9} className="bg-muted/30 px-4 py-3 border-b">
        <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-2 text-sm">
          {items.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="text-foreground break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Sayfa kökünde bir kez sarılır; tablo içi tooltip'ler için zorunlu.
// ---------------------------------------------------------------------------
export function ChangeLogsTooltipProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RadixTooltipProvider delayDuration={200} skipDelayDuration={0}>
      {children}
    </RadixTooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Expanded row render — page.tsx'ten çağrılır
// ---------------------------------------------------------------------------
export function ChangeLogExpandedRow({ log }: { log: ChangeLog }) {
  return <ExpandedDetailPanel log={log} />;
}

// ---------------------------------------------------------------------------
// Sütun tanımları
// ---------------------------------------------------------------------------
export const columns: ColumnDef<ChangeLog>[] = [
  // Genişletme oku — meta.expandedIds (Set<number>) ve meta.toggleExpand kullanır
  {
    id: "expand",
    header: "",
    size: 32,
    cell: ({ row, table }) => {
      const meta = table.options.meta as
        | { expandedIds?: Set<number>; toggleExpand?: (id: number) => void }
        | undefined;
      const eventId = (row.original as ChangeLog).event_id;
      const isExpanded = meta?.expandedIds?.has(eventId) ?? false;
      const toggle = meta?.toggleExpand;
      return (
        <button
          onClick={() => toggle?.(eventId)}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label={isExpanded ? "Detayı kapat" : "Detayı aç"}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },

  // Tarih
  {
    accessorKey: "changed_at",
    header: "Tarih",
    cell: ({ row }) => (
      <div className="text-center whitespace-nowrap">
        {formatDate(row.getValue("changed_at"))}
      </div>
    ),
  },

  // İşlem tipi
  {
    accessorKey: "change_type",
    header: "İşlem",
    cell: ({ row }) => <ChangeTypeCell row={row} />,
    filterFn: (row, id, value: unknown) => {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return true;
      return arr.includes(row.getValue(id));
    },
  },

  // Kaynak tablo (varsayılan gizli)
  {
    accessorKey: "table_name",
    header: "Kaynak",
    cell: ({ row }) => {
      const tableName = row.getValue("table_name") as string;
      return (
        <div className="text-center text-sm">
          {getTableLabelTr(tableName) || "-"}
        </div>
      );
    },
    filterFn: (row, id, value: unknown) => {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return true;
      return tableNameMatchesFilter(row.getValue(id) as string, arr as string[]);
    },
  },

  // Kayıt (row_id formatlanmış)
  {
    accessorKey: "row_id",
    header: "Kayıt",
    cell: ({ row }) => {
      const tableName = row.original.table_name;
      const rowId = row.getValue("row_id") as string;
      const formatted = formatRowIdDisplay(tableName, rowId);
      return <div className="text-center text-sm">{formatted}</div>;
    },
    filterFn: (row, id, value: unknown) => {
      if (typeof value !== "string" || !value.trim()) return true;
      const rawId = (row.getValue(id) as string) ?? "";
      const formatted = formatRowIdDisplay(row.original.table_name, rawId);
      const q = value.trim().toLowerCase();
      return (
        rawId.toLowerCase().includes(q) ||
        formatted.toLowerCase().includes(q)
      );
    },
  },

  // Alan (column_name)
  {
    accessorKey: "column_name",
    header: "Alan",
    cell: ({ row }) => {
      const raw = row.getValue("column_name") as string | null;
      if (raw == null || raw === "") {
        return (
          <div className="text-center text-sm">
            <span className="text-muted-foreground">-</span>
          </div>
        );
      }
      const col = getColumnLabelTr(row.original.table_name, raw);
      return <div className="text-center text-sm">{col}</div>;
    },
  },

  // Eski → Yeni
  {
    id: "value_change",
    header: "Eski → Yeni",
    meta: { align: "left" as const },
    cell: ({ row }) => {
      const type = row.original.change_type;
      const oldVal = row.original.old_value;
      const newVal = row.original.new_value;

      if (type !== "Güncelleme" || (oldVal == null && newVal == null)) {
        return <span className="text-muted-foreground text-xs">-</span>;
      }

      const display = `${oldVal ?? "—"} → ${newVal ?? "—"}`;
      return (
        <TruncatedCell text={display} maxWidth="max-w-[14rem]" />
      );
    },
    enableSorting: false,
  },

  // Açıklama
  {
    accessorKey: "description",
    header: "Açıklama",
    meta: { align: "left" as const },
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return <TruncatedCell text={description} maxWidth="max-w-[28rem]" />;
    },
    size: 400,
    enableSorting: true,
  },

  // Kim (change_owner)
  {
    accessorKey: "change_owner",
    header: "Kim",
    cell: ({ row }) => {
      const owner = row.getValue("change_owner") as string | null;
      return <div className="text-center">{owner || "-"}</div>;
    },
    filterFn: (row, id, value: unknown) => {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return true;
      return arr.includes(row.getValue(id));
    },
  },
];

export const columnIcon = <Columns2 className="h-4 w-4" />;
