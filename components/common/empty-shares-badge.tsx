"use client";

import { useEmptyShareCount } from "@/hooks/useEmptyShareCount";
import { cn } from "@/lib/utils";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";

interface EmptySharesBadgeProps {
    className?: string;
    textClassName?: string;
    size?: "sm" | "md" | "lg";
}

export default function EmptySharesBadge({
    className,
    textClassName,
    size = "md"
}: EmptySharesBadgeProps) {
    // Use the hook to get empty shares count (for real-time updates)
    const { data: apiEmptyShares } = useEmptyShareCount();

    // Get total empty shares from Zustand store
    const { totalEmptyShares } = useSacrificeStore();

    // Display empty shares count - use Zustand store first, fallback to API data
    const emptySharesCount = totalEmptyShares || apiEmptyShares || 0;

    // Determine display text based on remaining shares
    const displayText = emptySharesCount === 0 ? "Tüm hisseler tükendi" : `Son ${emptySharesCount} Hisse`;

    // Size-based classes
    const sizeClasses = {
        sm: "text-[11px] px-1.5 ml-3",
        md: "text-xs px-2 py-1 ml-2",
        lg: "text-base md:text-lg px-2.5 py-1.5 ml-2.5"
    };

    return (
        <span className={cn(
            "bg-sac-red text-white rounded-[2px] whitespace-nowrap",
            sizeClasses[size],
            className
        )}>
            <span className={textClassName}>{displayText}</span>
        </span>
    );
} 