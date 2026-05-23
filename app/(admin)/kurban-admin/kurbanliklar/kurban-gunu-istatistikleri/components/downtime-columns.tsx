"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";

export type AffectedStage = "slaughter" | "butcher" | "delivery";

export type DowntimeEvent = {
  id: string;
  tenant_id: string;
  sacrifice_year: number;
  affected_stage: AffectedStage;
  started_time: string;
  ended_time: string;
  duration_minutes: number;
  note: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DowntimeTableMeta = {
  onEdit: (row: DowntimeEvent) => void;
  onDelete: (id: string) => void;
};

export const kurbanGunuDowntimeColumnHeaderLabels: Record<string, string> = {
  affected_stage: "Aşama",
  started_time: "Başlangıç",
  ended_time: "Bitiş",
  duration_minutes: "Süre",
  note: "Not",
  actions: "İşlem",
};

const STAGE_LABELS: Record<AffectedStage, string> = {
  slaughter: "Kesim",
  butcher: "Parçalama",
  delivery: "Teslimat",
};

const STAGE_COLOR: Record<AffectedStage, string> = {
  slaughter: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  butcher: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  delivery: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

function formatTimeValue(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

function isOngoing(row: DowntimeEvent): boolean {
  return row.duration_minutes === 0 && row.started_time.slice(0, 5) === row.ended_time.slice(0, 5);
}

export const downtimeColumns: ColumnDef<DowntimeEvent>[] = [
  {
    accessorKey: "affected_stage",
    header: kurbanGunuDowntimeColumnHeaderLabels.affected_stage,
    cell: ({ row }) => {
      const stage = row.getValue("affected_stage") as AffectedStage;
      return (
        <Badge className={`text-xs ${STAGE_COLOR[stage]}`} variant="outline">
          {STAGE_LABELS[stage]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "started_time",
    header: kurbanGunuDowntimeColumnHeaderLabels.started_time,
    cell: ({ row }) => (
      <span className="tabular-nums">{formatTimeValue(row.getValue("started_time"))}</span>
    ),
  },
  {
    accessorKey: "ended_time",
    header: kurbanGunuDowntimeColumnHeaderLabels.ended_time,
    cell: ({ row }) =>
      isOngoing(row.original) ? (
        <span className="text-muted-foreground italic">Devam ediyor</span>
      ) : (
        <span className="tabular-nums">{formatTimeValue(row.getValue("ended_time"))}</span>
      ),
  },
  {
    accessorKey: "duration_minutes",
    header: kurbanGunuDowntimeColumnHeaderLabels.duration_minutes,
    cell: ({ row }) => {
      const mins = row.getValue("duration_minutes") as number;
      return mins > 0 ? `${mins} dk` : "—";
    },
  },
  {
    accessorKey: "note",
    header: kurbanGunuDowntimeColumnHeaderLabels.note,
    cell: ({ row }) => (
      <span className="text-muted-foreground max-w-[240px] truncate block">
        {(row.getValue("note") as string | null) || "—"}
      </span>
    ),
  },
  {
    id: "actions",
    header: kurbanGunuDowntimeColumnHeaderLabels.actions,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta as DowntimeTableMeta | undefined;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => meta?.onEdit(row.original)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => meta?.onDelete(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    },
  },
];
