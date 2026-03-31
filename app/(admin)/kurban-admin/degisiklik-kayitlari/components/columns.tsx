"use client";

import { formatDate } from "@/lib/date-utils";
import {
  formatChangeTypeTr,
  formatRowIdDisplay,
  getColumnLabelTr,
  getTableLabelTr,
  normalizeChangeType,
  tableNameMatchesFilter,
} from "@/lib/change-log-labels";
import { formatChangeLogOldNewArrow } from "@/lib/change-log-value-display";
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
  /** API: sacrifice_id → "Kurbanlık sıra #N" (Kurbanlıklar / uyumsuzluk) */
  row_id_label?: string | null;
  column_name: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string;
  /** DB: INSERT | UPDATE | DELETE */
  change_type: string;
  changed_at: string;
  change_owner: string | null;
  correlation_id: string | null;
  log_layer: string | null;
  sacrifice_year: number | null;
};

/** Tablo satırı: aynı correlation altındaki diğer kayıtlar expand ile */
export type ChangeLogViewRow = ChangeLog & {
  groupDetailRows?: ChangeLog[];
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
function ChangeTypeBadge({ changeType }: { changeType: string }) {
  const type = normalizeChangeType(changeType);
  const label = formatChangeTypeTr(changeType);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 min-w-[90px] justify-center text-xs font-semibold",
        type === "INSERT" && "bg-muted text-muted-foreground",
        type === "UPDATE" && "bg-sac-yellow-light text-sac-yellow",
        type === "DELETE" && "bg-sac-red-light text-sac-red"
      )}
    >
      {label}
    </span>
  );
}

function ChangeTypeCell({ row }: { row: Row<ChangeLogViewRow> }) {
  const raw = row.getValue("change_type") as string;
  return (
    <div className="text-center">
      <ChangeTypeBadge changeType={raw} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Genişletilmiş içerik: ana tablo ile aynı sütunlar (ilişki id / katman / yıl yok)
// ---------------------------------------------------------------------------
function ChangeLogInlineRow({ log }: { log: ChangeLog }) {
  const type = normalizeChangeType(log.change_type);
  const valueStr =
    type !== "UPDATE" || (log.old_value == null && log.new_value == null)
      ? "-"
      : formatChangeLogOldNewArrow(
          log.old_value,
          log.new_value,
          log.column_name
        );
  const colRaw = log.column_name;
  const colLabelText =
    colRaw == null || colRaw === ""
      ? "-"
      : getColumnLabelTr(log.table_name, colRaw);

  return (
    <tr className="border-b border-border/60 last:border-0 hover:bg-muted/40">
      <td className="w-8 p-2 align-middle" aria-hidden />
      <td className="p-2 align-middle whitespace-nowrap text-center text-xs md:text-sm text-foreground">
        {formatDate(log.changed_at)}
      </td>
      <td className="p-2 align-middle text-center">
        <ChangeTypeBadge changeType={log.change_type} />
      </td>
      <td className="p-2 align-middle text-center text-xs md:text-sm text-foreground">
        {getTableLabelTr(log.table_name) || "-"}
      </td>
      <td className="p-2 align-middle text-center text-xs md:text-sm text-foreground break-words">
        {formatRowIdDisplay(log.table_name, log.row_id ?? "", log.row_id_label)}
      </td>
      <td className="p-2 align-middle text-center text-xs md:text-sm text-foreground break-words">
        {colLabelText === "-" ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          colLabelText
        )}
      </td>
      <td className="p-2 align-middle text-left text-xs md:text-sm text-foreground">
        {valueStr === "-" ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <span className="inline-block max-w-[min(18rem,100%)] break-words">
            {valueStr}
          </span>
        )}
      </td>
      <td className="p-2 align-middle text-left text-xs md:text-sm text-foreground">
        <span className="inline-block max-w-[min(28rem,100%)] break-words whitespace-normal">
          {log.description}
        </span>
      </td>
      <td className="p-2 align-middle text-center text-xs md:text-sm text-foreground">
        {log.change_owner || "-"}
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
export function ChangeLogExpandedRow({ log }: { log: ChangeLogViewRow }) {
  const details = log.groupDetailRows;
  if (details && details.length > 0) {
    return (
      <tr className="border-b">
        <td colSpan={9} className="bg-muted/25 p-0 align-top border-b border-border/60">
          <div className="w-full min-w-0 p-2 box-border">
            <p className="text-[11px] font-medium text-muted-foreground mb-2 px-1">
              Aynı işlemdeki diğer kayıtlar
            </p>
            <div className="w-full min-w-0 overflow-x-auto rounded-md border border-border/50 bg-card">
              {/* table-fixed + iç içe tablo: colSpan hücresinde sütun genişliği 0 olabiliyor; table-auto + min-w */}
              <table className="w-full min-w-[760px] caption-bottom text-xs md:text-sm border-collapse text-foreground">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="w-8 p-2 font-medium" aria-hidden />
                    <th className="p-2 font-medium text-center whitespace-nowrap">
                      Tarih
                    </th>
                    <th className="p-2 font-medium text-center whitespace-nowrap">
                      İşlem
                    </th>
                    <th className="p-2 font-medium text-center">Tablo</th>
                    <th className="p-2 font-medium text-center">Kayıt</th>
                    <th className="p-2 font-medium text-center">Alan</th>
                    <th className="p-2 font-medium text-left">Eski → Yeni</th>
                    <th className="p-2 font-medium text-left">Açıklama</th>
                    <th className="p-2 font-medium text-center whitespace-nowrap">
                      Kim
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {details.map((d) => (
                    <ChangeLogInlineRow key={d.event_id} log={d} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </td>
      </tr>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sütun tanımları
// ---------------------------------------------------------------------------
export const columns: ColumnDef<ChangeLogViewRow>[] = [
  // Genişletme oku — meta.expandedIds (Set<number>) ve meta.toggleExpand kullanır
  {
    id: "expand",
    header: "",
    size: 32,
    cell: ({ row, table }) => {
      const meta = table.options.meta as
        | { expandedIds?: Set<number>; toggleExpand?: (id: number) => void }
        | undefined;
      const original = row.original as ChangeLogViewRow;
      const eventId = original.event_id;
      const hasGroupDetails =
        original.groupDetailRows != null && original.groupDetailRows.length > 0;
      const isExpanded = meta?.expandedIds?.has(eventId) ?? false;
      const toggle = meta?.toggleExpand;
      if (!hasGroupDetails) {
        return <span className="inline-block w-6" aria-hidden />;
      }
      return (
        <button
          type="button"
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
      const rowCode = normalizeChangeType(row.getValue(id) as string);
      return arr.some((v) => normalizeChangeType(String(v)) === rowCode);
    },
  },

  // Tablo (hangi kaynak tabloda işlem yapıldı)
  {
    accessorKey: "table_name",
    header: "Tablo",
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
      const label = row.original.row_id_label;
      const formatted = formatRowIdDisplay(tableName, rowId, label);
      return <div className="text-center text-sm">{formatted}</div>;
    },
    filterFn: (row, id, value: unknown) => {
      if (typeof value !== "string" || !value.trim()) return true;
      const rawId = (row.getValue(id) as string) ?? "";
      const formatted = formatRowIdDisplay(
        row.original.table_name,
        rawId,
        row.original.row_id_label
      );
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
      const type = normalizeChangeType(row.original.change_type);
      const oldVal = row.original.old_value;
      const newVal = row.original.new_value;

      if (type !== "UPDATE" || (oldVal == null && newVal == null)) {
        return <span className="text-muted-foreground text-xs">-</span>;
      }

      const display = formatChangeLogOldNewArrow(
        oldVal,
        newVal,
        row.original.column_name
      );
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

/** Sütunlar popover etiketleri (id → başlık) */
export const CHANGE_LOG_COLUMN_HEADER_MAP: Record<string, string> = {
  expand: "Genişlet",
  changed_at: "Tarih",
  change_type: "İşlem",
  table_name: "Tablo",
  row_id: "Kayıt",
  column_name: "Alan",
  value_change: "Eski → Yeni",
  description: "Açıklama",
  change_owner: "Kim",
};

export const columnIcon = <Columns2 className="h-4 w-4" />;
