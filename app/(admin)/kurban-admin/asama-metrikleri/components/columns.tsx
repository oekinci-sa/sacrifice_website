"use client";

import { ColumnDef } from "@tanstack/react-table";

export type StageMetric = {
  tenant_id: string;
  stage: string;
  avg_progress_duration: number | null;
  current_sacrifice_number: number | null;
};

export const columns: ColumnDef<StageMetric>[] = [
  {
    accessorKey: "tenant_id",
    header: "Kiracı ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {(row.getValue("tenant_id") as string)?.slice(0, 8)}…
      </span>
    ),
  },
  {
    accessorKey: "stage",
    header: "Aşama",
    cell: ({ row }) => row.getValue("stage"),
  },
  {
    accessorKey: "avg_progress_duration",
    header: "Ort. Süre (sn)",
    cell: ({ row }) => {
      const val = row.getValue("avg_progress_duration") as number | null;
      return val != null ? val : "-";
    },
  },
  {
    accessorKey: "current_sacrifice_number",
    header: "Güncel Kurban No",
    cell: ({ row }) => {
      const val = row.getValue("current_sacrifice_number") as number | null;
      return val != null ? val : "-";
    },
  },
];
