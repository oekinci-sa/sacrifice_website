"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { shareholderSchema } from "@/types";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { useEffect, useMemo, useState } from "react";
import { kurbanliklarColumnHeaderLabels } from "@/lib/admin-table-column-labels/kurbanliklar";
import { columns } from "./components/columns";
import { NewSacrificeAnimal } from "./components/new-sacrifice-animal";
import { ToolbarAndFilters } from "./ToolbarAndFilters";

export default function TumKurbanliklarPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  // Search and filter state
  const [globalFilter] = useState("");

  // Get sacrifices data from Zustand store
  const {
    sacrifices,
    isLoadingSacrifices,
    isInitialized: sacrificesInitialized,
    refetchSacrifices
  } = useSacrificeStore();

  // Get shareholders data from Zustand store
  const {
    shareholders,
    isLoading: shareholdersLoading,
    isInitialized: shareholdersInitialized,
    fetchShareholders
  } = useShareholderStore();

  // Initialize data if not already loaded
  useEffect(() => {
    if (selectedYear == null) return;
    // Load sacrifices if not initialized
    if (!sacrificesInitialized || sacrifices.length === 0) {
      refetchSacrifices(selectedYear);
    }

    // Load shareholders if not initialized
    if (!shareholdersInitialized || shareholders.length === 0) {
      fetchShareholders(selectedYear);
    }
  }, [
    selectedYear,
    sacrificesInitialized,
    sacrifices.length,
    refetchSacrifices,
    shareholdersInitialized,
    shareholders.length,
    fetchShareholders
  ]);

  // Combine sacrifices with their shareholders
  const sacrificesWithShareholders = useMemo(() => {
    if (!sacrifices || !shareholders) return [];

    // Group shareholders by sacrifice_id
    const shareholdersByAnimal = (shareholders || []).reduce((acc, shareholder) => {
      if (!acc[shareholder.sacrifice_id]) {
        acc[shareholder.sacrifice_id] = [];
      }
      acc[shareholder.sacrifice_id].push(shareholder);
      return acc;
    }, {} as Record<string, shareholderSchema[]>);

    // Combine sacrifices with their shareholders
    return sacrifices.map(sacrifice => ({
      ...sacrifice,
      shareholders: shareholdersByAnimal[sacrifice.sacrifice_id] || []
    }));
  }, [sacrifices, shareholders]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return sacrificesWithShareholders;

    const needle = normalizeTurkishSearchText(globalFilter.trim());

    return sacrificesWithShareholders.filter((sacrifice) => {
      const sacrificeNoStr = normalizeTurkishSearchText(
        sacrifice.sacrifice_no?.toString() ?? ""
      );
      if (sacrificeNoStr.includes(needle)) {
        return true;
      }
      if (
        sacrifice.notes &&
        normalizeTurkishSearchText(sacrifice.notes).includes(needle)
      ) {
        return true;
      }
      return false;
    });
  }, [sacrificesWithShareholders, globalFilter]);

  // Show loading state when either data is loading
  const isLoading = isLoadingSacrifices || shareholdersLoading;

  // Show error state if there's an error fetching data
  if (useShareholderStore(state => state.error)) {
    return (
      <div className="space-y-8">
        <div className="w-full">
          <h1 className="text-2xl font-semibold tracking-tight">Kurbanlıklar</h1>
          <p className="text-muted-foreground mt-2 max-w-[75%]">
            Kurbanlık ekleyebilir, hisse ve fiyatları yönetebilirsiniz.
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-md text-red-500">
          Veri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="w-full">
          <h1 className="text-2xl font-semibold tracking-tight">Kurbanlıklar</h1>
          <p className="text-muted-foreground mt-2 max-w-[75%]">
            Kurbanlık ekleyebilir, hisse ve fiyatları yönetebilirsiniz.
          </p>
        </div>
        <NewSacrificeAnimal />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <CustomDataTable
          data={filteredData}
          columns={columns}
          storageKey="kurbanliklar"
          defaultPageSize={200}
          columnHeaderLabels={kurbanliklarColumnHeaderLabels}
          initialState={{
            columnVisibility: {
              notes: true,
              foundation: false,
              ear_tag: true,
            },
          }}
          filters={({ table, columnOrder, onColumnOrderChange, resetColumnLayout }) => (
            <ToolbarAndFilters
              table={table}
              columnOrder={columnOrder ?? []}
              onColumnOrderChange={onColumnOrderChange}
              onResetColumnLayout={resetColumnLayout}
            />
          )}
          tableSize="medium"
        />
      )}
    </div>
  );
} 