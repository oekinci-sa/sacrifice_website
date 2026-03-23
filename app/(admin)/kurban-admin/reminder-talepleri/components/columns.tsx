"use client";

import { formatDate } from "@/lib/date-utils";
import {
  formatPersonNameForDisplay,
  formatPhoneForDisplayWithSpacing,
} from "@/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";

export type ReminderRequest = {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  sacrifice_year: number;
  created_at: string;
};

export const columns: ColumnDef<ReminderRequest>[] = [
  {
    accessorKey: "name",
    header: "Ad Soyad",
    cell: ({ row }) => (
      <span className="font-medium">
        {formatPersonNameForDisplay(String(row.getValue("name") ?? ""))}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Telefon",
    cell: ({ row }) =>
      formatPhoneForDisplayWithSpacing(row.getValue("phone") ?? ""),
  },
  {
    accessorKey: "sacrifice_year",
    header: "Yıl",
    cell: ({ row }) => row.getValue("sacrifice_year"),
  },
  {
    accessorKey: "created_at",
    header: "Kayıt Tarihi",
    cell: ({ row }) => formatDate(row.getValue("created_at")),
  },
];
