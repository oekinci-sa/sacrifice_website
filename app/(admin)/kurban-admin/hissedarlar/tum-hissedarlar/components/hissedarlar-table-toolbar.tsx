"use client";

import { Button } from "@/components/ui/button";
import { exportTableToExcel } from "@/lib/export-to-excel";
import { shareholderSchema } from "@/types";
import { ColumnFiltersState, Table, VisibilityState } from "@tanstack/react-table";
import { Download, X } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { ColumnSelectorPopover } from "./column-selector-popover";
import { ShareholderFilters } from "./shareholder-filters";
import { ShareholderSearch } from "./shareholder-search";

/** Sütun seçici + Excel için başlık eşlemesi (modül düzeyi — toolbar içinde kullanılır) */
export const SHAREHOLDER_COLUMN_HEADER_MAP: Record<string, string> = {
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
  second_phone_number: "İkinci Telefon",
};

type ToolbarProps = {
  table: Table<shareholderSchema>;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  onColumnOrderChange?: (order: string[]) => void;
  columnOrder: string[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

/**
 * Modül düzeyinde tanımlı — sayfa içinde oluşturulmaz; aksi halde her parent render'da
 * yeni bileşen tipi oluşur ve ShareholderSearch remount olup input metnini sıfırlar.
 */
export const HissedarlarTableToolbar = memo(function HissedarlarTableToolbar({
  table,
  columnFilters,
  columnVisibility: _columnVisibility,
  onColumnFiltersChange,
  onColumnOrderChange,
  columnOrder,
  searchTerm,
  setSearchTerm,
}: ToolbarProps) {
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    const hasColumnFilters = columnFilters.length > 0;
    const hasSearchFilter = searchTerm.trim().length > 0;
    setIsFiltered(hasColumnFilters || hasSearchFilter);
  }, [columnFilters, searchTerm]);

  const handleResetFilters = () => {
    table.resetColumnFilters();
    onColumnFiltersChange([]);
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between w-full gap-3">
        <ShareholderSearch
          onSearch={setSearchTerm}
          className="w-96 sm:w-[28rem] max-w-full min-w-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          <ColumnSelectorPopover
            table={table}
            columnHeaderMap={SHAREHOLDER_COLUMN_HEADER_MAP}
            columnOrder={columnOrder ?? []}
            onColumnOrderChange={onColumnOrderChange}
          />
          <Button
            onClick={() =>
              exportTableToExcel(table, "hissedarlar", SHAREHOLDER_COLUMN_HEADER_MAP)
            }
            variant="outline"
            size="sm"
            className="h-8 border-dashed flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Excel&apos;e Aktar
          </Button>
        </div>
      </div>

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
}, (prevProps, nextProps) =>
  prevProps.table === nextProps.table &&
  prevProps.columnFilters === nextProps.columnFilters &&
  prevProps.searchTerm === nextProps.searchTerm &&
  JSON.stringify(prevProps.columnVisibility) ===
    JSON.stringify(nextProps.columnVisibility) &&
  JSON.stringify(prevProps.columnOrder) === JSON.stringify(nextProps.columnOrder));

HissedarlarTableToolbar.displayName = "HissedarlarTableToolbar";
