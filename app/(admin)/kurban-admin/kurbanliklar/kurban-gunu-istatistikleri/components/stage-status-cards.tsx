"use client";

import { Clock } from "lucide-react";

type StageKey = "slaughter_stage" | "butcher_stage" | "delivery_stage";

type StageMetric = {
  current_sacrifice_number?: number | null;
  avg_progress_duration?: number | null;
};

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "—";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} dk`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} sa` : `${h} sa ${m} dk`;
}

const STAGES: { key: StageKey; label: string }[] = [
  { key: "slaughter_stage", label: "Kesim" },
  { key: "butcher_stage", label: "Parçalama" },
  { key: "delivery_stage", label: "Teslimat" },
];

type Props = {
  stageMetrics: Partial<Record<StageKey, StageMetric>>;
  loading?: boolean;
};

export function StageStatusCards({ stageMetrics, loading }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {STAGES.map(({ key, label }) => {
        const m = stageMetrics[key];
        return (
          <div key={key} className="space-y-3 p-4 border rounded-md font-sans">
            <h3 className="text-sm font-medium">{label}</h3>
            <div className="text-left space-y-1">
              <div className="text-xl font-bold tabular-nums">
                {loading ? "…" : (m?.current_sacrifice_number ?? 1)}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  güncel sıra
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Ort. süre:{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {loading ? "…" : formatDuration(m?.avg_progress_duration ?? 0)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
