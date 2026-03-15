"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { shareholderSchema } from "@/types";
import { ColumnFiltersState, Table, VisibilityState } from "@tanstack/react-table";
import { Download, SlidersHorizontal, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { exportTableToExcel } from "@/lib/export-to-excel";
import { columns } from "./components/columns";
import { ShareholderFilters } from "./components/shareholder-filters";
import { ShareholderSearch } from "./components/shareholder-search";

export default function TumHissedarlarPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Default column visibility - hide notes and others by default
  const [columnVisibility] = useState<VisibilityState>({
    notes: false,
    last_edited_time: false,
    last_edited_by: false
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
    delivery_location: "Teslimat Noktası",
    notes: "Notlar",
    purchase_time: "Kayıt Tarihi",
    sacrifice_consent: "Vekalet",
    last_edited_time: "Son Güncelleme Tarihi",
    last_edited_by: "Son Güncelleyen"
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
    ({ table, columnFilters, columnVisibility: _columnVisibility, onColumnFiltersChange, searchTerm, setSearchTerm }: {
      table: Table<shareholderSchema>,
      columnFilters: ColumnFiltersState,
      columnVisibility: VisibilityState,
      onColumnFiltersChange: (filters: ColumnFiltersState) => void,
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
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {/* Filter components */}
            <ShareholderFilters table={table} />

            {/* Reset filters button - always shown when any filter is active */}
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

          <div className="flex items-center gap-3">
            {/* Search - left of Sütunlar */}
            <ShareholderSearch onSearch={setSearchTerm} />
            {/* Columns dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-dashed flex items-center gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Sütunlar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      column.id !== "security_code" &&
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        column.toggleVisibility(!!value);
                      }}
                    >
                      {columnHeaderMap[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export to Excel button - with matching style */}
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
      );
    },
    // Re-render when columnVisibility changes so Sütunlar dropdown works correctly
    (prevProps, nextProps) =>
      prevProps.table === nextProps.table &&
      prevProps.columnFilters === nextProps.columnFilters &&
      JSON.stringify(prevProps.columnVisibility) === JSON.stringify(nextProps.columnVisibility)
  );

  // Display name for debugging
  MemoizedFiltersComponent.displayName = "MemoizedFiltersComponent";

  if (error) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Tüm Hissedarlar</h1>
        <div className="bg-red-50 p-4 rounded-md text-red-500">
          Hissedar verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" suppressHydrationWarning>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tüm Hissedarlar</h1>
        <p className="text-muted-foreground mt-2">
          Hisse alan kişilerin listesini görüntüleyebilir, görüşme durumlarını işaretleyebilirsiniz.
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
          initialState={{
            columnVisibility: columnVisibility
          }}
          filters={({ table, columnFilters, onColumnFiltersChange }) => (
            <MemoizedFiltersComponent
              table={table}
              columnFilters={columnFilters}
              columnVisibility={table.getState().columnVisibility}
              onColumnFiltersChange={onColumnFiltersChange}
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