import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number;
  maxValue: number;
  suffix?: string;
  displayValue?: number;
  actionLink?: {
    text: string;
    href: string;
  };
}

export function StatCard({
  title,
  value,
  maxValue,
  suffix = "",
  displayValue,
  actionLink,
}: StatCardProps) {
  const percentage = Math.round((value / maxValue) * 100);
  const displayPercentage = displayValue ? Math.round((displayValue / maxValue) * 100) : percentage;

  // Get progress colors based on percentage
  const getProgressColors = (percentage: number) => {
    if (percentage < 25) {
      return {
        progressColor: "#D22D2D",
        progressBgColor: "#FCEFEF",
      };
    } else if (percentage < 75) {
      return {
        progressColor: "#F9BC06",
        progressBgColor: "#FFFAEC",
      };
    } else {
      return {
        progressColor: "#39C645",
        progressBgColor: "#F0FBF1",
      };
    }
  };

  const { progressColor, progressBgColor } = getProgressColors(displayPercentage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {actionLink && (
          <Link
            href={actionLink.href}
            className="text-sm text-muted-foreground hover:underline"
          >
            {actionLink.text}
          </Link>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline">
          <div className="text-2xl font-bold">
            {value.toLocaleString("tr-TR")}
            {suffix && <span>{suffix}</span>}
          </div>
          <div className="text-sm text-muted-foreground ml-1">/ {maxValue.toLocaleString("tr-TR")}{suffix}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Progress
          value={displayPercentage}
          className={`h-2 flex-1 transition-all`}
          style={{
            '--progress-background': progressBgColor,
            '--progress-foreground': progressColor,
            background: 'var(--progress-background)',
          } as React.CSSProperties}
        />
        <span className="text-sm font-medium text-muted-foreground">
          %{displayPercentage}
        </span>
      </div>
    </div>
  );
} 