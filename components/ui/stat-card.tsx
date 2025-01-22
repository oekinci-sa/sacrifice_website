import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number;
  maxValue?: number;
  suffix?: string;
  actionLink?: {
    text: string;
    href: string;
  };
}

export function StatCard({ title, value, maxValue, suffix = "", actionLink }: StatCardProps) {
  const [progress, setProgress] = useState(0);
  const percentage = maxValue ? Math.round((value / maxValue) * 100) : null;

  useEffect(() => {
    if (percentage !== null) {
      const timer = setTimeout(() => setProgress(percentage), 100);
      return () => clearTimeout(timer);
    }
  }, [percentage]);

  const getProgressColors = (progress: number) => {
    if (progress < 25) {
      return {
        text: "#D22D2D",
        background: "#FCEFEF",
      };
    } else if (progress < 75) {
      return {
        text: "#F9BC06",
        background: "#FFFAEC",
      };
    } else {
      return {
        text: "#39C645",
        background: "#F0FBF1",
      };
    }
  };

  const colors = percentage !== null ? getProgressColors(percentage) : null;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {actionLink && (
            <Link 
              href={actionLink.href}
              className="text-sm text-primary hover:text-primary/90 font-heading"
            >
              {actionLink.text}
            </Link>
          )}
        </div>
        <div className="text-2xl font-bold font-heading">
          {value.toLocaleString("tr-TR")}{suffix}
        </div>
        {percentage !== null && colors && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress 
                value={progress} 
                className="h-2"
                style={{
                  backgroundColor: colors.background,
                  "--progress-foreground": colors.text,
                } as React.CSSProperties}
              />
            </div>
            <div 
              className="font-heading min-w-[3rem] text-right"
              style={{ color: colors.text }}
            >
              {percentage}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 