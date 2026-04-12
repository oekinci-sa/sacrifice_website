"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { AdminOdemelerTeslimatSkeleton } from "../components/admin-page-skeletons";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { shareholderSchema } from "@/types";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { getDeliverySelectionFromLocation } from "@/lib/delivery-options";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { ColumnDef, type Table } from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditableDeliveryCell, EditableDeliveryLocationCell, EditableSecondPhoneCell } from "../components/editable-delivery-cells";
import { ShareholderSearch } from "../hissedarlar/tum-hissedarlar/components/shareholder-search";
import { TeslimatFilters } from "./components/teslimat-filters";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { exportTableToExcel } from "@/lib/export-to-excel";
import { ExcelExportConfirmDialog } from "@/components/excel-export/excel-export-confirm-dialog";
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
  const [excelConfirmOpen, setExcelConfirmOpen] = useState(false);
  const tableForExcelRef = useRef<Table<shareholderSchema> | null>(null);
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
      const q = normalizeTurkishSearchText(searchTerm.trim());
      const qDigits = searchTerm.replace(/\D/g, "");
      data = data.filter((sh) => {
        if (q && sh.shareholder_name && normalizeTurkishSearchText(sh.shareholder_name).includes(q)) {
          return true;
        }
        if (qDigits && sh.phone_number?.replace(/\D/g, "").includes(qDigits)) {
          return true;
        }
        return false;
      });
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
        <AdminOdemelerTeslimatSkeleton rows={12} />
      ) : (
        <CustomDataTable
          columns={columns}
          data={sortedData}
          getRowId={(row) => row.shareholder_id}
          storageKey="teslimatlar"
          initialState={{ columnVisibility: { second_phone_number: false } }}
          tableSize="medium"
          pageSizeOptions={[20, 50, 100, 200]}
          filters={({ table, columnOrder, onColumnOrderChange, columnFilters, resetColumnLayout }) => {
            tableForExcelRef.current = table;
            const hasAnyFilter =
              columnFilters.length > 0 || searchTerm.trim().length > 0;
            return (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <ShareholderSearch onSearch={setSearchTerm} className="w-96 sm:w-[28rem] max-w-full min-w-0" />
                  <div className="flex items-center gap-2 shrink-0">
                    <ColumnSelectorPopover
                      table={table}
                      columnHeaderMap={TESLIMATLAR_COLUMN_HEADER_MAP}
                      columnOrder={columnOrder ?? []}
                      onColumnOrderChange={onColumnOrderChange}
                      onResetColumnLayout={resetColumnLayout}
                    />
                    <Button
                      type="button"
                      onClick={() => setExcelConfirmOpen(true)}
                      variant="outline"
                      size="sm"
                      className="h-8 border-dashed flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Excel&apos;e Aktar
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
                  <div className="flex flex-1 flex-wrap items-center gap-3 min-w-0">
                    <TeslimatFilters table={table} />
                  </div>
                  {hasAnyFilter ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-dashed gap-1.5 shrink-0 ml-auto"
                      onClick={() => {
                        table.resetColumnFilters();
                        setSearchTerm("");
                      }}
                    >
                      <X className="h-4 w-4 shrink-0" />
                      Tüm filtreleri temizle
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          }}
        />
      )}
      <ExcelExportConfirmDialog
        open={excelConfirmOpen}
        onOpenChange={setExcelConfirmOpen}
        onConfirm={() => {
          const t = tableForExcelRef.current;
          if (!t) return;
          exportTableToExcel(t, "teslimatlar", TESLIMATLAR_COLUMN_HEADER_MAP);
        }}
      />
    </div>
  );
}
