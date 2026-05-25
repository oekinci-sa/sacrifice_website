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

const STAGES: { key: StageKey; label: string; color: string }[] = [
  { key: "slaughter_stage", label: "Kesim", color: "text-red-600" },
  { key: "butcher_stage", label: "Parçalama", color: "text-orange-600" },
  { key: "delivery_stage", label: "Teslimat", color: "text-green-600" },
];

type Props = {
  stageMetrics: Partial<Record<StageKey, StageMetric>>;
  loading?: boolean;
};

export function StageStatusCards({ stageMetrics, loading }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {STAGES.map(({ key, label, color }) => {
        const m = stageMetrics[key];
        return (
          <div key={key} className="space-y-3 p-4 border rounded-md font-sans">
            <h3 className={`text-sm font-medium ${color}`}>{label}</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Güncel Sıra</span>
                <span className="font-bold text-lg tabular-nums">
                  {loading ? "…" : (m?.current_sacrifice_number ?? 1)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  Ort. Süre
                </span>
                <span className="font-medium tabular-nums">
                  {loading ? "…" : formatDuration(m?.avg_progress_duration ?? 0)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
