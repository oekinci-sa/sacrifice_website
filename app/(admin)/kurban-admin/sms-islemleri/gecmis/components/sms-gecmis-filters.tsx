"use client";

import { DataTableFacetedFilter } from "@/app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/shareholder-filters";
import { Table } from "@tanstack/react-table";
import { useEffect, useMemo } from "react";
import { smsGecmisColumnHeaderLabels, SmsSendRow } from "./sms-gecmis-columns";

const STATUS_OPTIONS = [
  { label: "Operatöre gönderildi", value: "completed" },
  { label: "Kısmen gönderildi", value: "partial_fail" },
  { label: "Başarısız", value: "failed" },
  { label: "Gönderiliyor", value: "sending" },
  { label: "Kuyrukta", value: "queued" },
  { label: "Taslak", value: "draft" },
  { label: "İptal edildi", value: "cancelled" },
];

const FAILED_OPTIONS = [{ label: "Başarısız var", value: "has_failed" }];

function senderLabel(s: SmsSendRow) {
  return (s.created_by_display && s.created_by_display.trim()) || s.created_by || "—";
}

interface SmsGecmisFiltersProps {
  table: Table<SmsSendRow>;
}

export function SmsGecmisFilters({ table }: SmsGecmisFiltersProps) {
  const senderOptions = useMemo(() => {
    const senders = new Set<string>();
    table.getPreFilteredRowModel().rows.forEach((row) => {
      senders.add(senderLabel(row.original));
    });
    return Array.from(senders)
      .sort((a, b) => a.localeCompare(b, "tr"))
      .map((label) => ({ label, value: label }));
  }, [table]);

  useEffect(() => {
    const senderColumn = table.getColumn("created_by_display");
    if (senderColumn) {
      senderColumn.columnDef.filterFn = (row, _id, filterValues: string[]) => {
        if (!filterValues?.length) return true;
        return filterValues.includes(senderLabel(row.original));
      };
    }
  }, [table]);

  useEffect(() => {
    const statusColumn = table.getColumn("status");
    if (statusColumn) {
      statusColumn.columnDef.filterFn = (row, _id, filterValues: string[]) => {
        if (!filterValues?.length) return true;
        return filterValues.includes(row.getValue("status") as string);
      };
    }
  }, [table]);

  useEffect(() => {
    const failedColumn = table.getColumn("failed_count");
    if (failedColumn) {
      failedColumn.columnDef.filterFn = (row, _id, filterValues: string[]) => {
        if (!filterValues?.length) return true;
        const failed = (row.getValue("failed_count") as number) ?? 0;
        if (filterValues.includes("has_failed")) return failed > 0;
        return true;
      };
    }
  }, [table]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {table.getColumn("created_by_display") && senderOptions.length > 0 && (
        <DataTableFacetedFilter
          column={table.getColumn("created_by_display")}
          title={smsGecmisColumnHeaderLabels.created_by_display}
          options={senderOptions}
          type="sender"
        />
      )}
      {table.getColumn("status") && (
        <DataTableFacetedFilter
          column={table.getColumn("status")}
          title={smsGecmisColumnHeaderLabels.status}
          options={STATUS_OPTIONS}
          type="status"
        />
      )}
      {table.getColumn("failed_count") && (
        <DataTableFacetedFilter
          column={table.getColumn("failed_count")}
          title={smsGecmisColumnHeaderLabels.failed_count}
          options={FAILED_OPTIONS}
          type="failed"
        />
      )}
    </div>
  );
}
