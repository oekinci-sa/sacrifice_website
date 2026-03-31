"use client";

import { ColumnSelectorPopover } from "@/app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/column-selector-popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PlusCircle, X } from "lucide-react";
import { useMemo } from "react";
import { ChangeLogSearch } from "./change-log-search";
import { ChangeLog, CHANGE_LOG_COLUMN_HEADER_MAP } from "./columns";

/** DB: INSERT | UPDATE | DELETE — filtre değeri İngilizce, etiket Türkçe */
const CHANGE_TYPE_OPTIONS = [
  { value: "INSERT", label: "Ekleme" },
  { value: "UPDATE", label: "Güncelleme" },
  { value: "DELETE", label: "Silme" },
] as const;

/** DB'de İngilizce kod; etiket Türkçe (lib/change-log-labels ile uyumlu) */
const CHANGE_LOG_TABLE_OPTIONS: { value: string; label: string }[] = [
  { value: "sacrifice_animals", label: "Kurbanlıklar" },
  { value: "shareholders", label: "Hissedarlar" },
  { value: "mismatched_share_acknowledgments", label: "Hisse uyumsuzluğu" },
  { value: "users", label: "Kullanıcılar" },
  { value: "user_tenants", label: "Kullanıcı–organizasyon" },
  { value: "stage_metrics", label: "Aşama metrikleri" },
];

export type ChangeLogDatePreset = "all" | "today" | "last7" | "last30";

const DATE_PRESET_SELECT: { value: ChangeLogDatePreset; label: string }[] = [
  { value: "all", label: "Tüm zamanlar" },
  { value: "today", label: "Bugün" },
  { value: "last7", label: "Son 7 gün" },
  { value: "last30", label: "Son 30 gün" },
];

function datePresetLabel(preset: ChangeLogDatePreset): string {
  return DATE_PRESET_SELECT.find((x) => x.value === preset)?.label ?? "Tüm zamanlar";
}

const FilterCountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <div className="admin-tenant-accent absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs md:hidden">
      {count}
    </div>
  ) : null;

function SelectedFilterBadges({
  values,
  resolveLabel,
}: {
  values: string[];
  resolveLabel: (value: string) => string;
}) {
  if (values.length === 0) return null;
  return (
    <div className="hidden md:flex gap-1 ml-2 flex-wrap max-w-[min(100%,280px)]">
      <AnimatePresence>
        {values.map((value, index) => (
          <motion.span
            key={value}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: index * 0.04 }}
            className="bg-muted text-xs px-2 py-0.5 truncate max-w-[120px]"
            title={resolveLabel(value)}
          >
            {resolveLabel(value)}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ChangeLogFiltersProps {
  table: Table<ChangeLog>;
  columnFilters: ColumnFiltersState;
  columnOrder: string[];
  onColumnOrderChange?: (order: string[]) => void;
  resetColumnLayout?: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  datePreset: ChangeLogDatePreset;
  onDatePresetChange: (preset: ChangeLogDatePreset) => void;
}

export function ChangeLogFilters({
  table,
  columnFilters,
  columnOrder,
  onColumnOrderChange,
  resetColumnLayout,
  searchValue,
  onSearchChange,
  datePreset,
  onDatePresetChange,
}: ChangeLogFiltersProps) {
  const changeOwnerOptions = useMemo(() => {
    const owners = new Set<string>();

    table.getPreFilteredRowModel().rows.forEach((row) => {
      const owner = row.original.change_owner;
      if (owner && owner.trim()) owners.add(owner);
    });

    return Array.from(owners).sort((a, b) => a.localeCompare(b));
  }, [table]);

  const tableNameFilter =
    (table.getColumn("table_name")?.getFilterValue() as string[] | undefined) ?? [];
  const changeTypeFilter =
    (table.getColumn("change_type")?.getFilterValue() as string[] | undefined) ?? [];
  const changeOwnerFilter =
    (table.getColumn("change_owner")?.getFilterValue() as string[] | undefined) ?? [];

  const toggleTableValue = (value: string) => {
    const col = table.getColumn("table_name");
    const current = new Set(
      (col?.getFilterValue() as string[] | undefined) ?? []
    );
    if (current.has(value)) current.delete(value);
    else current.add(value);
    const arr = Array.from(current);
    col?.setFilterValue(arr.length ? arr : undefined);
  };

  const clearTableFilter = () => {
    table.getColumn("table_name")?.setFilterValue(undefined);
  };

  const toggleChangeTypeValue = (value: string) => {
    const col = table.getColumn("change_type");
    const current = new Set(
      (col?.getFilterValue() as string[] | undefined) ?? []
    );
    if (current.has(value)) current.delete(value);
    else current.add(value);
    const arr = Array.from(current);
    col?.setFilterValue(arr.length ? arr : undefined);
  };

  const clearChangeTypeFilter = () => {
    table.getColumn("change_type")?.setFilterValue(undefined);
  };

  const toggleChangeOwnerValue = (value: string) => {
    const col = table.getColumn("change_owner");
    const current = new Set(
      (col?.getFilterValue() as string[] | undefined) ?? []
    );
    if (current.has(value)) current.delete(value);
    else current.add(value);
    const arr = Array.from(current);
    col?.setFilterValue(arr.length ? arr : undefined);
  };

  const clearChangeOwnerFilter = () => {
    table.getColumn("change_owner")?.setFilterValue(undefined);
  };

  const resetAll = () => {
    onSearchChange("");
    onDatePresetChange("all");
    table.resetColumnFilters();
  };

  const hasAnyFilter =
    searchValue.trim().length > 0 ||
    datePreset !== "all" ||
    columnFilters.length > 0;

  const tableLabel = (v: string) =>
    CHANGE_LOG_TABLE_OPTIONS.find((o) => o.value === v)?.label ?? v;
  const typeLabel = (v: string) =>
    CHANGE_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v;

  return (
    <div className="flex flex-col gap-3 w-full p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="w-full min-w-0">
          <ChangeLogSearch
            onSearch={onSearchChange}
            searchValue={searchValue}
            className="relative w-96 max-w-full min-w-0 sm:w-[28rem]"
          />
        </div>
        {onColumnOrderChange ? (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <ColumnSelectorPopover
              table={table}
              columnHeaderMap={CHANGE_LOG_COLUMN_HEADER_MAP}
              columnOrder={columnOrder}
              onColumnOrderChange={onColumnOrderChange}
              onResetColumnLayout={resetColumnLayout}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-dashed text-xs whitespace-nowrap flex items-center justify-start relative"
              >
                <PlusCircle className="mr-2 h-3 w-3 shrink-0" />
                Tarih
                {datePreset !== "all" ? (
                  <span className="ml-2 bg-muted text-xs px-1.5 py-0.5 rounded shrink-0 max-w-[140px] truncate">
                    {datePresetLabel(datePreset)}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>Sonuç yok.</CommandEmpty>
                  <CommandGroup>
                    {DATE_PRESET_SELECT.map(({ value, label }) => (
                      <CommandItem
                        key={value}
                        value={label}
                        onSelect={() => onDatePresetChange(value)}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                            datePreset === value
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-primary opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </div>
                        <span>{label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-dashed text-xs whitespace-nowrap flex items-center justify-start relative"
              >
                <PlusCircle className="mr-2 h-3 w-3 shrink-0" />
                Tablo
                <SelectedFilterBadges
                  values={tableNameFilter}
                  resolveLabel={tableLabel}
                />
                <FilterCountBadge count={tableNameFilter.length} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>Sonuç yok.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="clear-tables"
                      onSelect={() => clearTableFilter()}
                    >
                      <span className="text-muted-foreground text-xs">
                        Tümünü göster (filtreyi kaldır)
                      </span>
                    </CommandItem>
                    {CHANGE_LOG_TABLE_OPTIONS.map((opt) => {
                      const selected = tableNameFilter.includes(opt.value);
                      return (
                        <CommandItem
                          key={opt.value}
                          value={opt.label}
                          onSelect={() => toggleTableValue(opt.value)}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border shrink-0",
                              selected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-primary opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span>{opt.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-dashed text-xs whitespace-nowrap flex items-center justify-start relative"
              >
                <PlusCircle className="mr-2 h-3 w-3 shrink-0" />
                İşlem tipi
                <SelectedFilterBadges
                  values={changeTypeFilter}
                  resolveLabel={typeLabel}
                />
                <FilterCountBadge count={changeTypeFilter.length} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>Sonuç yok.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="clear-types"
                      onSelect={() => clearChangeTypeFilter()}
                    >
                      <span className="text-muted-foreground text-xs">
                        Tümünü göster (filtreyi kaldır)
                      </span>
                    </CommandItem>
                    {CHANGE_TYPE_OPTIONS.map((opt) => {
                      const selected = changeTypeFilter.includes(opt.value);
                      return (
                        <CommandItem
                          key={opt.value}
                          value={opt.label}
                          onSelect={() => toggleChangeTypeValue(opt.value)}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border shrink-0",
                              selected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-primary opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span>{opt.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-dashed text-xs whitespace-nowrap flex items-center justify-start max-w-[min(100%,320px)] relative"
              >
                <PlusCircle className="mr-2 h-3 w-3 shrink-0" />
                Düzenleyen
                <SelectedFilterBadges
                  values={changeOwnerFilter}
                  resolveLabel={(v) => v}
                />
                <FilterCountBadge count={changeOwnerFilter.length} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(100vw-2rem,320px)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Düzenleyen ara..." className="h-9" />
                <CommandList className="max-h-[min(60vh,320px)]">
                  <CommandEmpty>Sonuç yok.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="clear-owners"
                      onSelect={() => clearChangeOwnerFilter()}
                    >
                      <span className="text-muted-foreground text-xs">
                        Tümünü göster (filtreyi kaldır)
                      </span>
                    </CommandItem>
                    {changeOwnerOptions.map((owner) => {
                      const selected = changeOwnerFilter.includes(owner);
                      return (
                        <CommandItem
                          key={owner}
                          value={owner}
                          onSelect={() => toggleChangeOwnerValue(owner)}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border shrink-0",
                              selected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-primary opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span className="truncate">{owner}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {hasAnyFilter ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-dashed gap-1.5 text-xs shrink-0 ml-auto"
            onClick={resetAll}
          >
            <X className="h-3.5 w-3.5 shrink-0" />
            Tüm filtreleri temizle
          </Button>
        ) : null}
      </div>
    </div>
  );
}
