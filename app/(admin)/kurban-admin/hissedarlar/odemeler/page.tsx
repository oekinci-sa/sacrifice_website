"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Button } from "@/components/ui/button";
import { ColumnSelectorPopover } from "../tum-hissedarlar/components/column-selector-popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { shareholderSchema } from "@/types";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { formatDateMedium } from "@/lib/date-utils";
import { getDeliverySelectionFromLocation, getDeliveryTypeDisplayLabel } from "@/lib/delivery-options";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { exportTableToExcel } from "@/lib/export-to-excel";
import { EditablePaidAmountCell } from "./components/editable-paid-amount-cell";
import { PaymentFilters } from "./components/payment-filters";
import { ShareholderSearch } from "../tum-hissedarlar/components/shareholder-search";

const ODEMELER_COLUMN_HEADER_MAP: Record<string, string> = {
  sacrifice_no: "Kur. Sır.",
  shareholder_name: "İsim Soyisim",
  phone_number: "Telefon",
  sacrifice_info: "Hisse Bedeli",
  delivery_fee: "Teslimat Ücreti",
  delivery_location: "Teslimat Tercihi",
  delivery_location_raw: "Teslimat Yeri",
  paid_amount: "Ödeme Yapılan Tutar",
  remaining_payment: "Kalan Tutar",
  payment_status: "Ödeme Durumu",
  purchase_time: "Kayıt Tarihi",
};

export default function OdemelerPage() {
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
    updateShareholder,
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
        header: "Kur. Sır.",
        cell: ({ row }) => {
          const sacrifice = row.original.sacrifice;
          const sacrificeNo = sacrifice?.sacrifice_no ?? "-";
          return <span className="font-medium">{sacrificeNo}</span>;
        },
      },
      {
        accessorKey: "shareholder_name",
        header: "İsim Soyisim",
        cell: ({ row }) => row.getValue("shareholder_name"),
      },
      {
        accessorKey: "phone_number",
        header: "Telefon",
        enableSorting: false,
        cell: ({ row }) =>
          formatPhoneForDisplayWithSpacing(row.original.phone_number || ""),
      },
      {
        id: "sacrifice_info",
        accessorFn: (row) => row.sacrifice?.share_weight ?? "-",
        header: "Hisse Bedeli",
        cell: ({ row }) => {
          const s = row.original.sacrifice;
          const w = s?.share_weight;
          const p = s?.share_price;
          if (w == null && p == null) return "-";
          const weightStr = w != null ? `${w} kg.` : "";
          const priceStr = p != null
            ? new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p) + " TL"
            : "";
          return <span className="tabular-nums">{[weightStr, priceStr].filter(Boolean).join(" - ")}</span>;
        },
      },
      {
        accessorKey: "delivery_fee",
        header: "Teslimat Ücreti",
        cell: ({ row }) => {
          const val = parseFloat(row.original.delivery_fee?.toString() ?? "0");
          return (
            <span className="tabular-nums">
              {new Intl.NumberFormat("tr-TR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(val)}{" "}
              TL
            </span>
          );
        },
      },
      {
        accessorKey: "delivery_location",
        header: "Teslimat Tercihi",
        cell: ({ row }) => {
          const type = row.original.delivery_type ?? getDeliverySelectionFromLocation(branding.logo_slug, row.original.delivery_location || "");
          return getDeliveryTypeDisplayLabel(branding.logo_slug, type, null, false);
        },
      },
      {
        id: "delivery_location_raw",
        accessorFn: (row) => row.delivery_location ?? "",
        header: "Teslimat Yeri",
        cell: ({ row }) => (
          <span title={row.original.delivery_location || undefined}>
            {row.original.delivery_location || "-"}
          </span>
        ),
      },
      {
        accessorKey: "paid_amount",
        header: "Ödeme Yapılan Tutar",
        cell: ({ row }) => (
          <EditablePaidAmountCell row={row} onUpdate={updateShareholder} />
        ),
      },
      {
        accessorKey: "remaining_payment",
        header: "Kalan Tutar",
        cell: ({ row }) => {
          const val = parseFloat(row.original.remaining_payment.toString());
          return (
            <span className="tabular-nums">
              {new Intl.NumberFormat("tr-TR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(val)}{" "}
              TL
            </span>
          );
        },
      },
      {
        accessorKey: "purchase_time",
        header: "Kayıt Tarihi",
        cell: ({ row }) => formatDateMedium(row.getValue("purchase_time")),
      },
      {
        id: "payment_status",
        header: "Ödeme Durumu",
        accessorFn: (row) => {
          const paid = parseFloat(row.paid_amount.toString());
          const total = parseFloat(row.total_amount.toString());
          return total > 0 ? (paid / total) * 100 : 0;
        },
        cell: ({ row }) => {
          const paid = parseFloat(row.original.paid_amount.toString());
          const total = parseFloat(row.original.total_amount.toString());
          let label: string;
          if (total > 0 && paid >= total) {
            label = "Tamamlandı";
          } else if (total > 0 && paid >= branding.deposit_amount) {
            label = "Tüm Ödeme Bekleniyor";
          } else {
            label = "Kapora Bekleniyor";
          }
          return <span className="text-sm">{label}</span>;
        },
        enableHiding: true,
      },
    ],
    [updateShareholder, branding.logo_slug, branding.deposit_amount]
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
          <h1 className="text-2xl font-semibold tracking-tight">Ödemeler</h1>
          <p className="text-muted-foreground mt-2 max-w-[75%]">
            Hissedar ödemelerini takip edebilir ve güncelleyebilirsiniz.
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
        <h1 className="text-2xl font-semibold tracking-tight">Ödemeler</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Hissedar ödemelerini takip edebilir ve güncelleyebilirsiniz.
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
          storageKey="odemeler"
          tableSize="medium"
          pageSizeOptions={[20, 50, 100, 200]}
          initialState={{ columnVisibility: { delivery_location: false, delivery_location_raw: false } }}
          filters={({ table, columnOrder, onColumnOrderChange, columnFilters }) => {
            const hasAnyFilter =
              columnFilters.length > 0 || searchTerm.trim().length > 0;
            return (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <ShareholderSearch onSearch={setSearchTerm} className="w-96 sm:w-[28rem] max-w-full min-w-0" />
                  <div className="flex items-center gap-2 shrink-0">
                    <ColumnSelectorPopover
                      table={table}
                      columnHeaderMap={ODEMELER_COLUMN_HEADER_MAP}
                      columnOrder={columnOrder ?? []}
                      onColumnOrderChange={onColumnOrderChange}
                    />
                    <Button
                      onClick={() => exportTableToExcel(table, "odemeler", ODEMELER_COLUMN_HEADER_MAP)}
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
                    <PaymentFilters table={table} />
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
    </div>
  );
}
