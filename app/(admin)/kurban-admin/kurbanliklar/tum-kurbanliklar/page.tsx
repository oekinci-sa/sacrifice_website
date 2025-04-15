"use client";

import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSacrifices } from "@/hooks/useSacrifices";
import { useGetShareholders } from "@/hooks/useShareholders";
import { shareholderSchema } from "@/types";
import { useMemo, useState } from "react";
import { columns } from "./components/columns";
import { NewSacrificeAnimal } from "./components/new-sacrifice-animal";
import { ToolbarAndFilters } from "./ToolbarAndFilters";

export default function TumKurbanliklarPage() {
  // Search and filter state
  const [globalFilter] = useState("");

  // Fetch sacrifices using React Query
  const {
    data: sacrifices,
    isLoading: sacrificesLoading,
    error: sacrificesError,
  } = useSacrifices();

  // Fetch shareholders using React Query
  const {
    data: shareholders,
    isLoading: shareholdersLoading,
    error: shareholdersError
  } = useGetShareholders();

  // Combine sacrifices with their shareholders
  const sacrificesWithShareholders = useMemo(() => {
    if (!sacrifices || !shareholders) return [];

    // Group shareholders by sacrifice_id
    const shareholdersByAnimal = shareholders.reduce((acc, shareholder) => {
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

    const lowerCaseFilter = globalFilter.toLowerCase();

    return sacrificesWithShareholders.filter(sacrifice => {
      // Search in sacrifice_no - ensure we convert to string and use lowercase comparison
      const sacrificeNoStr = sacrifice.sacrifice_no?.toString().toLowerCase() || '';
      if (sacrificeNoStr.includes(lowerCaseFilter)) {
        return true;
      }

      // Search in notes
      if (sacrifice.notes &&
        sacrifice.notes.toLowerCase().includes(lowerCaseFilter)) {
        return true;
      }

      // Search only in the fields above, not in other columns
      return false;
    });
  }, [sacrificesWithShareholders, globalFilter]);

  // Show loading state when either data is loading
  const isLoading = sacrificesLoading || shareholdersLoading;

  // Show error state if there's an error fetching data
  if (sacrificesError || shareholdersError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tüm Kurbanlıklar</h1>
          <p className="text-muted-foreground">
            Sistemde kayıtlı tüm kurbanlıkların listesi
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-md text-red-500">
          Veri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tüm Kurbanlıklar</h2>
        <NewSacrificeAnimal />
      </div>

      <p className="text-muted-foreground">
        Sistemde kayıtlı tüm kurbanlıkların listesi
      </p>

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
          filters={({ table }) => (
            <ToolbarAndFilters
              table={table}
            />
          )}
        />
      )}
    </div>
  );
} 