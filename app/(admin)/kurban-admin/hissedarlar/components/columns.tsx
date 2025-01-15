"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatPhoneForDisplay } from "@/utils/formatters";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "shareholder_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="İsim Soyisim" />
    ),
  },
  {
    accessorKey: "phone_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Telefon" />
    ),
    cell: ({ row }) => {
      const phone = formatPhoneForDisplay(row.getValue("phone_number"));
      return phone;
    },
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Toplam Tutar" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_amount"));
      const formatted = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "payment_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ödeme Durumu" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("payment_status");

      return (
        <Badge variant={status === "paid" ? "default" : "secondary"}>
          {status === "paid" ? "Tamamlandı" : "Bekliyor"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "payment_ratio",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ödeme Oranı" />
    ),
    cell: ({ row }) => {
      const total = parseFloat(row.getValue("total_amount"));
      const deposit = parseFloat(row.original.paid_amount) || 0;
      const ratio = (deposit / total) * 100;

      return <div className="font-medium">%{ratio.toFixed(0)}</div>;
    },
  },
  {
    accessorKey: "delivery_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Teslimat Tipi" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("delivery_type");
      return type === "kesimhane" ? "Kesimhane" : "Toplu Teslimat";
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "sacrifice_consent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vekalet" />
    ),
    cell: ({ row }) => {
      const sacrifice_consent = row.getValue("sacrifice_consent");

      return (
        <Badge
          variant={sacrifice_consent === "verildi" ? "default" : "secondary"}
        >
          {sacrifice_consent === "verildi" ? "Verildi" : "Bekleniyor"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
