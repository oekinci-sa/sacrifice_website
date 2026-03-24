"use client";

import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import {
  Content,
  Portal,
  Provider as RadixTooltipProvider,
  Root as TooltipRoot,
  Trigger as TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Columns2 } from "lucide-react";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

export type ChangeLog = {
  event_id: number;
  table_name: string;
  row_id: string;
  column_name: string;
  old_value: string | null;
  new_value: string | null;
  description: string;
  change_type: "Ekleme" | "Güncelleme" | "Silme";
  changed_at: string;
  change_owner: string | null;
};

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

/**
 * Tablo hücresinde taşmayı keser; yalnızca gerçekten kısalmışsa Radix tooltip (üst Provider gerekir).
 * Ölçüm: layout sonrası çift rAF ile tablo genişliği oturduktan sonra.
 */
function TruncatedDescriptionCell({ text }: { text: string }) {
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

  const lineClass =
    "block w-full max-w-[28rem] min-w-0 truncate text-left";

  const inner = (
    <div ref={ref} className={cn(lineClass, truncated && "cursor-default")}>
      {text}
    </div>
  );

  if (!truncated) {
    return (
      <div className="min-w-0 max-w-[28rem]">
        {inner}
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-[28rem]">
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

/** Sayfa kökünde bir kez sarılır; tablo içi tooltip’ler için zorunlu. */
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

export const columns: ColumnDef<ChangeLog>[] = [
  {
    accessorKey: "changed_at",
    header: "Tarih",
    cell: ({ row }) => {
      return (
        <div className="text-center">
          {formatDate(row.getValue("changed_at"))}
        </div>
      );
    },
  },
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
  {
    accessorKey: "description",
    header: "Açıklama",
    meta: { align: "left" as const },
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return <TruncatedDescriptionCell text={description} />;
    },
    size: 400,
    enableSorting: true,
  },
  {
    accessorKey: "table_name",
    header: "Tablo",
    cell: ({ row }) => {
      const tableName = row.getValue("table_name") as string;
      return <div className="text-center">{tableName || "-"}</div>;
    },
    filterFn: (row, id, value: unknown) => {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return true;
      return arr.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "change_owner",
    header: "Son Düzenleyen",
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
