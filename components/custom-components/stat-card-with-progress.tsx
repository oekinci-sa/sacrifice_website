"use client";

import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  maxValue?: number;
  suffix?: string;
  displayValue?: number;
  actionLink?: {
    text: string;
    href: string;
  };
  description?: string;
  icon?: LucideIcon;
  type?: "default" | "warning";
  format?: "currency" | "number";
}

function StatCard({
  title,
  value,
  maxValue,
  suffix = "",
  displayValue,
  actionLink,
  description,
  icon: Icon,
  type = "default",
  format = "number"
}: StatCardProps) {
  // Helper function to format numbers as currency
  const formatValue = (val: number): string => {
    if (format === "currency") {
      return new Intl.NumberFormat('tr-TR', { 
        style: 'currency', 
        currency: 'TRY',
        maximumFractionDigits: 0 
      }).format(val);
    }
    return val.toLocaleString("tr-TR") + suffix;
  };

  // If maxValue is not provided, just show the value without progress bar
  if (!maxValue) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className={`rounded-lg p-2 ${
              type === "warning" 
                ? "bg-[#FCEFEF] text-[#D22D2D]" 
                : "bg-[#F0FBF1] text-[#39C645]"
            }`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold">
              {formatValue(value)}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const percentage = Math.round((value / maxValue) * 100);
  const displayPercentage = displayValue ? Math.round((displayValue / maxValue) * 100) : percentage;
  const remaining = maxValue - (displayValue || value);

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
    <div className="space-y-4 p-4 border rounded-md">
      {/* Title and "Tümünü Göster" button at the top */}
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
      
      {/* "... / ... (Kalan: ...)" format in the middle - left aligned */}
      <div className="text-left">
        <div className="text-xl font-bold">
          {formatValue(displayValue || value)}
          <span className="text-sm font-normal text-muted-foreground">
            {" / "}{formatValue(maxValue)}
            {" "}
            <span className="text-sm">(Kalan: {formatValue(remaining)})</span>
          </span>
        </div>
      </div>
      
      {/* Progress bar + percentage at the bottom */}
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

export function StatCardWithProgress(props: StatCardProps) {
  return <StatCard {...props} />;
} 