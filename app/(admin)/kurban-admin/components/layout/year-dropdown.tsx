"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";

export function YearDropdown() {
  const {
    selectedYear,
    availableYears,
    isLoading,
    isInitialized,
    setSelectedYear,
    fetchActiveYear,
  } = useAdminYearStore();

  useEffect(() => {
    if (!isInitialized) {
      fetchActiveYear();
    }
  }, [isInitialized, fetchActiveYear]);

  if (isLoading || selectedYear == null) {
    return (
      <div className="flex h-9 min-w-[80px] items-center justify-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
        ...
      </div>
    );
  }

  const years = availableYears.length > 0 ? availableYears : [selectedYear];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 min-w-[80px] gap-1 px-3 text-sm font-medium"
        >
          {selectedYear}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[80px]">
        {years.map((year) => (
          <DropdownMenuItem
            key={year}
            onClick={() => setSelectedYear(year)}
            className={year === selectedYear ? "bg-accent" : ""}
          >
            {year}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
