"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  paidAmount: number;
  totalAmount: number;
  depositAmount: number;
}

export function ProgressBar({ paidAmount, totalAmount, depositAmount }: ProgressBarProps) {
  // Calculate progress percentage
  const progress = Math.min(Math.round((paidAmount / totalAmount) * 100), 100);

  // Determine color based on payment status
  const getColor = () => {
    if (paidAmount < depositAmount) return "bg-sac-red"; // Red for kapora not paid
    if (paidAmount < totalAmount) return "bg-sac-yellow"; // Yellow for partial payment
    return "bg-sac-primary"; // Green for full payment
  };

  return (
    <div className="space-y-2 w-full">
      <div className="h-2 bg-gray-100 rounded-full w-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", getColor())}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0 TL</span>
        <span>{totalAmount.toLocaleString('tr-TR')} TL</span>
      </div>
    </div>
  );
} 