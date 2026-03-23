"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MailRecipientRow } from "@/lib/mail-recipient-rows";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { useMemo } from "react";

export type SourceFilter = "all" | "panel" | "shareholder" | "reminder";

type Props = {
  table: Table<MailRecipientRow>;
  /** Tablo içi filtreler değişince üst bileşenin yeniden render olması için geçirilir (memo sorunu). */
  columnFilters: ColumnFiltersState;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sourceFilter: SourceFilter;
  setSourceFilter: (v: SourceFilter) => void;
  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  listLoading: boolean;
};

export function MailRecipientsToolbar({
  table,
  columnFilters,
  searchTerm,
  setSearchTerm,
  sourceFilter,
  setSourceFilter,
  onSelectAllFiltered,
  onClearSelection,
  listLoading,
}: Props) {
  const hasFilter = useMemo(
    () =>
      searchTerm.trim().length > 0 ||
      sourceFilter !== "all" ||
      columnFilters.length > 0,
    [searchTerm, sourceFilter, columnFilters]
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSourceFilter("all");
    table.resetColumnFilters();
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <div className="relative w-96 max-w-full min-w-0 sm:w-[28rem]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
        <Input
          placeholder="Mail sahibi, adres veya kaynak metninde ara…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-9"
          aria-label="Tabloda ara"
          disabled={listLoading}
        />
      </div>

      {/* Kurbanlıklar alt satırı: sol filtre(ler) + sağda temizle — burada kaynak + seçimi temizle; sağda koşullu temizle + filtrelenenleri seç */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full min-w-0">
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
          <Select
            value={sourceFilter}
            onValueChange={(v) => setSourceFilter(v as SourceFilter)}
            disabled={listLoading}
          >
            <SelectTrigger className="h-8 border-dashed text-xs w-[min(200px,100%)] max-w-[220px] shrink-0 justify-between gap-2 px-2.5">
              <SelectValue placeholder="Kaynak" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm kaynaklar</SelectItem>
              <SelectItem value="panel">Site Yöneticileri</SelectItem>
              <SelectItem value="shareholder">Hissedar</SelectItem>
              <SelectItem value="reminder">Bana haber ver</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs shrink-0"
            onClick={onClearSelection}
            disabled={listLoading}
          >
            Seçimi temizle
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
          {hasFilter ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-dashed gap-1.5"
              disabled={listLoading}
              onClick={resetFilters}
            >
              <X className="h-4 w-4 shrink-0" />
              Tüm filtreleri temizle
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-dashed gap-1.5"
            onClick={onSelectAllFiltered}
            disabled={listLoading}
          >
            Filtrelenenleri seç
          </Button>
        </div>
      </div>
    </div>
  );
}
