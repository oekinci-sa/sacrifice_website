"use client";

import { usePublicYearStore } from "@/stores/only-public-pages/usePublicYearStore";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function PublicYearProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { fetchActiveYear } = usePublicYearStore();

  useEffect(() => {
    const yearParam = searchParams.get("year");
    const yearFromUrl = yearParam && !Number.isNaN(parseInt(yearParam, 10))
      ? parseInt(yearParam, 10)
      : null;

    fetchActiveYear(yearFromUrl).catch(() => {});
  }, [pathname, searchParams, fetchActiveYear]);

  return <>{children}</>;
}
