import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface ProgressCardProps {
  title: string;
  value: number;
  maxValue: number;
}

export function ProgressCard({ title, value, maxValue }: ProgressCardProps) {
  const [progress, setProgress] = useState(0);
  const percentage = Math.round((value / maxValue) * 100);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium font-heading">{title}</h3>
        <div className="flex items-center justify-between">
          <div className="text-4xl font-bold font-heading">{value}</div>
          <div className="text-muted-foreground font-heading">{percentage}%</div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
} 