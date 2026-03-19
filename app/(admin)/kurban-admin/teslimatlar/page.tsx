"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { shareholderSchema } from "@/types";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { getDeliverySelectionFromLocation } from "@/lib/delivery-options";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { EditableDeliveryCell, EditableDeliveryLocationCell, EditableSecondPhoneCell } from "../components/editable-delivery-cells";
import { ShareholderSearch } from "../hissedarlar/tum-hissedarlar/components/shareholder-search";
import { TeslimatFilters } from "./components/teslimat-filters";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportTableToExcel } from "@/lib/export-to-excel";
import { ColumnSelectorPopover } from "../hissedarlar/tum-hissedarlar/components/column-selector-popover";

const TESLIMATLAR_COLUMN_HEADER_MAP: Record<string, string> = {
  sacrifice_no: "Kurbanlık Sırası",
  shareholder_name: "İsim Soyisim",
  phone_number: "Cep Telefonu",
  second_phone_number: "İkinci Telefon",
  delivery_type: "Teslimat Tercihi",
  delivery_location: "Teslimat Yeri",
};

export default function TeslimatlarPage() {
  const branding = useTenantBranding();
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    shareholders: allShareholders,
    isLoading,
    error,
    isInitialized,
    fetchShareholders,
    enableRealtime,
    realtimeEnabled,
  } = useShareholderStore();

  useEffect(() => {
    if (selectedYear == null) return;
    if (!isInitialized || allShareholders.length === 0) {
      fetchShareholders(selectedYear);
    }
    if (!realtimeEnabled) {
      enableRealtime();
    }
  }, [selectedYear, isInitialized, allShareholders.length, fetchShareholders, enableRealtime, realtimeEnabled]);

  const columns: ColumnDef<shareholderSchema>[] = useMemo(
    () => [
      {
        id: "sacrifice_no",
        accessorFn: (row) => row.sacrifice?.sacrifice_no ?? 0,
        header: "Kurbanlık Sırası",
        minSize: 90,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.sacrifice?.sacrifice_no ?? "-"}
          </span>
        ),
        filterFn: (row, id, filterValues: (string | number)[]) => {
          if (!filterValues?.length) return true;
          const no = row.original.sacrifice?.sacrifice_no ?? 0;
          return filterValues.some((fv) => String(no) === String(fv));
        },
      },
      {
        accessorKey: "shareholder_name",
        header: "İsim Soyisim",
        minSize: 156,
        cell: ({ row }) => (
          <span>
            {row.original.shareholder_name || "-"}
          </span>
        ),
      },
      {
        accessorKey: "phone_number",
        header: "Cep Telefonu",
        minSize: 176,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums whitespace-nowrap">
            {formatPhoneForDisplayWithSpacing(row.original.phone_number || "")}
          </span>
        ),
      },
      {
        accessorKey: "second_phone_number",
        header: "İkinci Telefon",
        minSize: 176,
        enableSorting: false,
        cell: ({ row }) => <EditableSecondPhoneCell row={row} />,
      },
      {
        id: "delivery_type",
        accessorFn: (row) =>
          getDeliverySelectionFromLocation(branding.logo_slug, row.delivery_location || ""),
        header: "Teslimat Tercihi",
        minSize: 176,
        cell: ({ row }) => <EditableDeliveryCell row={row} />,
        filterFn: (row, _id, filterValues: string[]) => {
          if (!filterValues?.length) return true;
          const type = getDeliverySelectionFromLocation(
            branding.logo_slug,
            row.original.delivery_location || ""
          );
          return filterValues.includes(type);
        },
      },
      {
        accessorKey: "delivery_location",
        header: "Teslimat Yeri",
        minSize: 280,
        cell: ({ row }) => <EditableDeliveryLocationCell row={row} />,
        filterFn: (row, id, filterValues: string[]) => {
          if (!filterValues?.length) return true;
          const loc = row.original.delivery_location ?? "";
          return filterValues.includes(loc);
        },
      },
    ],
    [branding.logo_slug]
  );

  const sortedData = useMemo(() => {
    let data = allShareholders || [];
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (sh) =>
          sh.shareholder_name?.toLowerCase().includes(lower) ||
          sh.phone_number?.includes(searchTerm.replace(/\s/g, ""))
      );
    }
    return [...data].sort((a, b) => {
      const noA = a.sacrifice?.sacrifice_no ?? 0;
      const noB = b.sacrifice?.sacrifice_no ?? 0;
      return Number(noA) - Number(noB);
    });
  }, [allShareholders, searchTerm]);

  if (error) {
    return (
      <div className="space-y-8">
        <div className="w-full">
          <h1 className="text-2xl font-semibold tracking-tight">Teslimatlar</h1>
          <p className="text-muted-foreground mt-2 max-w-[75%]">
            Hissedar teslimat bilgilerini görüntüleyebilir ve düzenleyebilirsiniz.
          </p>
        </div>
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          Veri yüklenirken bir hata oluştu.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Teslimatlar</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Hissedar teslimat bilgilerini görüntüleyebilir, teslimat tercihi ve yerini düzenleyebilirsiniz.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <CustomDataTable
          columns={columns}
          data={sortedData}
          storageKey="teslimatlar"
          initialState={{ columnVisibility: { second_phone_number: false } }}
          tableSize="medium"
          pageSizeOptions={[20, 50, 100, 200]}
          filters={({ table, columnOrder, onColumnOrderChange }) => (
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex flex-wrap items-center gap-3">
                <ShareholderSearch onSearch={setSearchTerm} className="w-64 sm:w-72" />
                <TeslimatFilters table={table} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ColumnSelectorPopover
                  table={table}
                  columnHeaderMap={TESLIMATLAR_COLUMN_HEADER_MAP}
                  columnOrder={columnOrder ?? []}
                  onColumnOrderChange={onColumnOrderChange}
                />
                <Button
                  onClick={() => exportTableToExcel(table, "teslimatlar", TESLIMATLAR_COLUMN_HEADER_MAP)}
                  variant="outline"
                  size="sm"
                  className="h-8 border-dashed flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Excel&apos;e Aktar
                </Button>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
