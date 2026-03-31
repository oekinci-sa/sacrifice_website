"use client";

import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { useEffect, useState } from "react";
import { AdminGenelBakisContentSkeleton } from "../components/admin-page-skeletons";
import { SummaryCards } from "./components/summary-cards";
import { SummaryGraphs } from "./components/summary-graphs";

export default function GenelBakisPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const {
    isInitialized: sacrificesInitialized,
    refetchSacrifices,
  } = useSacrificeStore();
  const {
    isInitialized: shareholdersInitialized,
    fetchShareholders,
  } = useShareholderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedYear == null) return;
    if (!sacrificesInitialized) refetchSacrifices(selectedYear);
    if (!shareholdersInitialized) fetchShareholders(selectedYear);
  }, [selectedYear, sacrificesInitialized, shareholdersInitialized, refetchSacrifices, fetchShareholders]);

  useEffect(() => {
    setLoading(!(sacrificesInitialized && shareholdersInitialized));
  }, [sacrificesInitialized, shareholdersInitialized]);

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Genel Bakış</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Kurban satış ve dağıtım sürecinin özet bilgileri.
        </p>
      </div>

      {loading ? <AdminGenelBakisContentSkeleton /> : (
        <>
          <SummaryCards />
          <SummaryGraphs />
        </>
      )}
    </div>
  );
}
