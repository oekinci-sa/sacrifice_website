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

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium font-heading">{title}</h3>
          {actionLink && (
            <Link 
              href={actionLink.href}
              className="text-sm text-primary hover:text-primary/90 font-heading"
            >
              {actionLink.text}
            </Link>
          )}
        </div>
        <div className="text-4xl font-bold font-heading">
          {value.toLocaleString("tr-TR")}{suffix}
        </div>
        {percentage !== null && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress 
                value={progress} 
                className="h-2 bg-[#A4EABB]" 
              />
            </div>
            <div className="text-muted-foreground font-heading min-w-[3rem] text-right">
              {percentage}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 