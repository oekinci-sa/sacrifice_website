"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Button } from "@/components/ui/button";
import { ColumnSelectorPopover } from "./components/column-selector-popover";
import { Skeleton } from "@/components/ui/skeleton";
import { exportTableToExcel } from "@/lib/export-to-excel";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { shareholderSchema } from "@/types";
import { ColumnFiltersState, Table, VisibilityState } from "@tanstack/react-table";
import { Download, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { columns } from "./components/columns";
import { ShareholderFilters } from "./components/shareholder-filters";
import { ShareholderSearch } from "./components/shareholder-search";

export default function TumHissedarlarPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Default column visibility - Vekalet gizli, Kayıt Tarihi ve Ödeme görünür (sonda)
  const [columnVisibility] = useState<VisibilityState>({
    notes: false,
    last_edited_time: false,
    last_edited_by: false,
    sacrifice_consent: false,
    delivery_location_raw: false, // Teslimat Yeri - default gizli
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
    if (!isInitialized || allShareholders.length === 0) {
      fetchShareholders();
    }

    // Ensure realtime updates are enabled
    if (!realtimeEnabled) {
      enableRealtime();
    }

    // Cleanup realtime subscription when component unmounts
    return () => {
      // We don't disable realtime here to keep the store updated for other components
    };
  }, [isInitialized, allShareholders.length, fetchShareholders, enableRealtime, realtimeEnabled]);

  // Column header mapping for dropdown - more descriptive names
  const columnHeaderMap: { [key: string]: string } = {
    shareholder_name: "İsim Soyisim",
    contacted_at: "Görüşüldü",
    phone_number: "Telefon",
    sacrifice_no: "Kurban No",
    share_count: "Hisse Sayısı",
    total_amount: "Toplam Tutar",
    paid_amount: "Ödenen Tutar",
    payment_status: "Ödeme Durumu",
    remaining_payment: "Kalan Ödeme",
    delivery_location: "Teslimat Tercihi",
    delivery_location_raw: "Teslimat Yeri",
    notes: "Notlar",
    purchase_time: "Kayıt Tarihi",
    sacrifice_consent: "Vekalet",
    last_edited_time: "Son Güncelleme Tarihi",
    last_edited_by: "Son Güncelleyen",
    sacrifice_info: "Hisse Bedeli",
  };

  // Filter the data client-side based on search term
  const filteredShareholders = useMemo(() => {
    if (!allShareholders || !searchTerm.trim()) {
      return allShareholders || [];
    }

    const lowercasedSearch = searchTerm.toLowerCase();

    return allShareholders.filter(shareholder => {
      // Search in shareholder name
      if (shareholder.shareholder_name?.toLowerCase().includes(lowercasedSearch)) {
        return true;
      }

      // Search in phone number
      if (shareholder.phone_number?.includes(lowercasedSearch)) {
        return true;
      }

      // Search in notes
      if (shareholder.notes?.toLowerCase().includes(lowercasedSearch)) {
        return true;
      }

      // Search only in the fields above, not in other columns
      return false;
    });
  }, [allShareholders, searchTerm]);

  // Memoized filters component
  const MemoizedFiltersComponent = React.memo(
    ({ table, columnFilters, columnVisibility: _columnVisibility, onColumnFiltersChange, onColumnOrderChange, columnOrder, searchTerm, setSearchTerm }: {
      table: Table<shareholderSchema>,
      columnFilters: ColumnFiltersState,
      columnVisibility: VisibilityState,
      onColumnFiltersChange: (filters: ColumnFiltersState) => void,
      onColumnOrderChange?: (order: string[]) => void,
      columnOrder: string[],
      searchTerm: string,
      setSearchTerm: (value: string) => void
    }) => {
      const [isFiltered, setIsFiltered] = useState(false);

      // Check if any filters are active
      useEffect(() => {
        const hasColumnFilters = columnFilters.length > 0;
        const hasSearchFilter = searchTerm.trim().length > 0;
        setIsFiltered(hasColumnFilters || hasSearchFilter);
      }, [columnFilters, searchTerm]);

      // Handle reset all filters
      const handleResetFilters = () => {
        table.resetColumnFilters();
        onColumnFiltersChange([]);
        setSearchTerm(""); // Also reset the search term
      };

      return (
        <div className="flex flex-col gap-3 w-full">
          {/* Üst satır: Search (solda, 2x genişlik) + Sütunlar + Excel (sağda) */}
          <div className="flex items-center justify-between w-full gap-3">
            <ShareholderSearch onSearch={setSearchTerm} className="w-96 sm:w-[28rem] max-w-full min-w-0" />
            <div className="flex items-center gap-2 shrink-0">
              <ColumnSelectorPopover
                table={table}
                columnHeaderMap={columnHeaderMap}
                columnOrder={columnOrder ?? []}
                onColumnOrderChange={onColumnOrderChange}
              />
              <Button
                onClick={() => exportTableToExcel(table, "hissedarlar", columnHeaderMap)}
                variant="outline"
                size="sm"
                className="h-8 border-dashed flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Excel&apos;e Aktar
              </Button>
            </div>
          </div>

          {/* Alt satır: Filtreler + Tüm filtreleri temizle */}
          <div className="flex items-center gap-3 flex-wrap">
            <ShareholderFilters table={table} />
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2 flex items-center gap-1"
              >
                <X className="h-4 w-4 mr-1" />
                Tüm filtreleri temizle
              </Button>
            )}
          </div>
        </div>
      );
    },
    // Re-render when columnVisibility, searchTerm or columnOrder changes
    (prevProps, nextProps) =>
      prevProps.table === nextProps.table &&
      prevProps.columnFilters === nextProps.columnFilters &&
      prevProps.searchTerm === nextProps.searchTerm &&
      JSON.stringify(prevProps.columnVisibility) === JSON.stringify(nextProps.columnVisibility) &&
      JSON.stringify(prevProps.columnOrder) === JSON.stringify(nextProps.columnOrder)
  );

  // Display name for debugging
  MemoizedFiltersComponent.displayName = "MemoizedFiltersComponent";

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
        <p className="text-muted-foreground mt-2 max-w-[50%]">
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
          filters={({ table, columnFilters, onColumnFiltersChange, onColumnOrderChange, columnOrder }) => (
            <MemoizedFiltersComponent
              table={table}
              columnFilters={columnFilters}
              columnVisibility={table.getState().columnVisibility}
              onColumnFiltersChange={onColumnFiltersChange}
              onColumnOrderChange={onColumnOrderChange}
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