"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  paidAmount: number;
  totalAmount: number;
}

export function ProgressBar({ paidAmount, totalAmount }: ProgressBarProps) {
  const progress = (paidAmount / totalAmount) * 100;
  const isDeposit = paidAmount >= 2000;
  const isFullyPaid = paidAmount >= totalAmount;

  return (
    <div className="w-full">
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            {
              "bg-[#D22D2D]": !isDeposit, // Kırmızı - Kapora ödenmemiş
              "bg-[#F9BC06]": isDeposit && !isFullyPaid, // Sarı - Kapora ödenmiş ama tamamlanmamış
              "bg-[#39C645]": isFullyPaid, // Yeşil - Tamamı ödenmiş
            }
          )}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
} 