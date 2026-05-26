"use client";

import { AdminSacrificeHisseBedeliTableCell } from "@/lib/admin-sacrifice-hisse-bedeli";
import { formatHisseBilgisiForExcel } from "@/lib/excel-export/format-hisse-bilgisi";
import { ColumnDef } from "@tanstack/react-table";
import {
  EditableDeliveredKgCell,
  EditableDeliveryNotesCell,
  EditableStageTimeCell,
} from "./editable-kurban-gunu-cells";

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
  delivered_share_kg?: number | null;
  delivery_notes?: string | null;
};

export const kurbanGunuAnimalColumnHeaderLabels: Record<string, string> = {
  sacrifice_no: "Kurban No",
  animal_type: "Tür",
  sacrifice_info: "Hisse Bilgisi",
  slaughter_time: "Kesim",
  butcher_time: "Parçalama",
  delivery_time: "Teslimat",
  delivered_share_kg: "Teslim Edilen Kg",
  delivery_notes: "Teslimat Notu",
};

export function createKurbanGunuAnimalColumns(
  onUpdate: (animal: KurbanGunuAnimalRow) => void
): ColumnDef<KurbanGunuAnimalRow>[] {
  return [
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
      cell: ({ row }) => (
        <EditableStageTimeCell row={row} field="slaughter_time" onUpdate={onUpdate} />
      ),
    },
    {
      accessorKey: "butcher_time",
      header: kurbanGunuAnimalColumnHeaderLabels.butcher_time,
      cell: ({ row }) => (
        <EditableStageTimeCell row={row} field="butcher_time" onUpdate={onUpdate} />
      ),
    },
    {
      accessorKey: "delivery_time",
      header: kurbanGunuAnimalColumnHeaderLabels.delivery_time,
      cell: ({ row }) => (
        <EditableStageTimeCell row={row} field="delivery_time" onUpdate={onUpdate} />
      ),
    },
    {
      accessorKey: "delivered_share_kg",
      header: kurbanGunuAnimalColumnHeaderLabels.delivered_share_kg,
      cell: ({ row }) => <EditableDeliveredKgCell row={row} onUpdate={onUpdate} />,
    },
    {
      accessorKey: "delivery_notes",
      header: kurbanGunuAnimalColumnHeaderLabels.delivery_notes,
      minSize: 160,
      size: 200,
      meta: { align: "left" },
      cell: ({ row }) => <EditableDeliveryNotesCell row={row} onUpdate={onUpdate} />,
      enableSorting: false,
    },
  ];
}
