"use client";

import { AdminSacrificeHisseBedeliTableCell } from "@/lib/admin-sacrifice-hisse-bedeli";
import { formatHisseBilgisiForExcel } from "@/lib/excel-export/format-hisse-bilgisi";
import { ColumnDef } from "@tanstack/react-table";

export type KurbanGunuAnimalRow = {
  sacrifice_id: string;
  sacrifice_no: number;
  animal_type: string;
  pricing_mode?: string | null;
  share_weight?: number | string | null;
  share_price?: number | null;
  live_scale_total_kg?: number | null;
  live_scale_total_price?: number | null;
  slaughter_time: string | null;
  butcher_time: string | null;
  delivery_time: string | null;
};

export const kurbanGunuAnimalColumnHeaderLabels: Record<string, string> = {
  sacrifice_no: "Kurban No",
  animal_type: "Tür",
  sacrifice_info: "Hisse Bilgisi",
  slaughter_time: "Kesim",
  butcher_time: "Parçalama",
  delivery_time: "Teslimat",
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export const animalColumns: ColumnDef<KurbanGunuAnimalRow>[] = [
  {
    accessorKey: "sacrifice_no",
    header: kurbanGunuAnimalColumnHeaderLabels.sacrifice_no,
    cell: ({ row }) => (
      <span className="font-semibold tabular-nums">{row.getValue("sacrifice_no")}</span>
    ),
  },
  {
    accessorKey: "animal_type",
    header: kurbanGunuAnimalColumnHeaderLabels.animal_type,
    cell: ({ row }) => <span className="capitalize">{row.getValue("animal_type")}</span>,
  },
  {
    id: "sacrifice_info",
    accessorFn: (row) => formatHisseBilgisiForExcel(row),
    header: kurbanGunuAnimalColumnHeaderLabels.sacrifice_info,
    cell: ({ row }) => <AdminSacrificeHisseBedeliTableCell sacrifice={row.original} />,
    minSize: 128,
    size: 152,
    maxSize: 220,
  },
  {
    accessorKey: "slaughter_time",
    header: kurbanGunuAnimalColumnHeaderLabels.slaughter_time,
    cell: ({ row }) => {
      const t = row.getValue("slaughter_time") as string | null;
      return t ? (
        <span className="text-green-600 font-medium">{formatTime(t)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "butcher_time",
    header: kurbanGunuAnimalColumnHeaderLabels.butcher_time,
    cell: ({ row }) => {
      const t = row.getValue("butcher_time") as string | null;
      return t ? (
        <span className="text-orange-600 font-medium">{formatTime(t)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "delivery_time",
    header: kurbanGunuAnimalColumnHeaderLabels.delivery_time,
    cell: ({ row }) => {
      const t = row.getValue("delivery_time") as string | null;
      return t ? (
        <span className="text-blue-600 font-medium">{formatTime(t)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
];
