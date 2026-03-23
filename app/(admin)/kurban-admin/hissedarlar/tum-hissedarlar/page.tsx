"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { VisibilityState } from "@tanstack/react-table";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { useEffect, useMemo, useState } from "react";
import { columns } from "./components/columns";
import { HissedarlarTableToolbar } from "./components/hissedarlar-table-toolbar";

export default function TumHissedarlarPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [searchTerm, setSearchTerm] = useState("");
  // Default column visibility - Vekalet gizli, Kayıt Tarihi ve Ödeme görünür (sonda)
  const [columnVisibility] = useState<VisibilityState>({
    notes: false,
    last_edited_time: false,
    last_edited_by: false,
    sacrifice_consent: false,
    delivery_location_raw: false, // Teslimat Yeri - default gizli
    second_phone_number: false, // İkinci Telefon - default gizli
  });

  // Use shareholder store instead of React Query
  const {
    shareholders: allShareholders,
    isLoading,
    error,
    isInitialized,
    fetchShareholders,
    enableRealtime,
    realtimeEnabled
  } = useShareholderStore();

  // Initialize data if not already loaded and enable realtime updates
  useEffect(() => {
    if (selectedYear == null) return;
    if (!isInitialized || allShareholders.length === 0) {
      fetchShareholders(selectedYear);
    }

    // Ensure realtime updates are enabled
    if (!realtimeEnabled) {
      enableRealtime();
    }

    // Cleanup realtime subscription when component unmounts
    return () => {
      // We don't disable realtime here to keep the store updated for other components
    };
  }, [selectedYear, isInitialized, allShareholders.length, fetchShareholders, enableRealtime, realtimeEnabled]);

  // Filter the data client-side based on search term
  const filteredShareholders = useMemo(() => {
    if (!allShareholders || !searchTerm.trim()) {
      return allShareholders || [];
    }

    const q = normalizeTurkishSearchText(searchTerm.trim());
    const qDigits = searchTerm.replace(/\D/g, "");

    return allShareholders.filter((shareholder) => {
      if (q && shareholder.shareholder_name && normalizeTurkishSearchText(shareholder.shareholder_name).includes(q)) {
        return true;
      }
      if (qDigits && shareholder.phone_number?.replace(/\D/g, "").includes(qDigits)) {
        return true;
      }
      if (q && shareholder.notes && normalizeTurkishSearchText(shareholder.notes).includes(q)) {
        return true;
      }
      return false;
    });
  }, [allShareholders, searchTerm]);

  if (error) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Hissedarlar</h1>
        <div className="bg-red-50 p-4 rounded-md text-red-500">
          Hissedar verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" suppressHydrationWarning>
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Hissedarlar</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Hisse alan kişileri görüntüleyebilir, görüşme ve ödeme durumunu takip edebilirsiniz.
        </p>
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
          columns={columns}
          data={filteredShareholders}
          storageKey="hissedarlar"
          initialState={{
            columnVisibility: columnVisibility
          }}
          filters={({ table, columnFilters, onColumnFiltersChange, onColumnOrderChange, columnOrder, resetColumnLayout }) => (
            <HissedarlarTableToolbar
              table={table}
              columnFilters={columnFilters}
              columnVisibility={table.getState().columnVisibility}
              onColumnFiltersChange={onColumnFiltersChange}
              onColumnOrderChange={onColumnOrderChange}
              onResetColumnLayout={resetColumnLayout}
              columnOrder={columnOrder}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          )}
          tableSize="medium"
          pageSizeOptions={[20, 50, 100, 200, 500]}
        />
      )}
    </div>
  );
} 