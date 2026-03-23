"use client";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { useMemo } from "react";
import { ChangeLogSearch } from "./change-log-search";
import { ChangeLog } from "./columns";

// change_logs tablosunda kullanılan table_name değerleri (DB trigger'larından)
const CHANGE_LOG_TABLE_OPTIONS: { value: string; label: string }[] = [
    { value: "Kurbanlıklar", label: "Kurbanlıklar" },
    { value: "Hissedarlar", label: "Hissedarlar" },
    { value: "Hisse Uyumsuzluğu", label: "Hisse Uyumsuzluğu" },
    { value: "Kullanıcılar", label: "Kullanıcılar" },
    { value: "Aşama Metrikleri", label: "Aşama Metrikleri" },
];

const CHANGE_TYPE_OPTIONS = [
    { value: "Ekleme", label: "Ekleme" },
    { value: "Güncelleme", label: "Güncelleme" },
    { value: "Silme", label: "Silme" },
] as const;

export type ChangeLogDatePreset = "all" | "today" | "last7" | "last30";

const DATE_PRESET_SELECT: { value: ChangeLogDatePreset; label: string }[] = [
    { value: "all", label: "Tüm zamanlar" },
    { value: "today", label: "Bugün" },
    { value: "last7", label: "Son 7 gün" },
    { value: "last30", label: "Son 30 gün" },
];

function QuickGroup({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </span>
            <div className="flex flex-wrap gap-0.5">{children}</div>
        </div>
    );
}

interface ChangeLogFiltersProps {
    table: Table<ChangeLog>;
    columnFilters: ColumnFiltersState;
    searchValue: string;
    onSearchChange: (value: string) => void;
    datePreset: ChangeLogDatePreset;
    onDatePresetChange: (preset: ChangeLogDatePreset) => void;
}

export function ChangeLogFilters({
    table,
    columnFilters,
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

    const tableNameFilter = (table.getColumn("table_name")?.getFilterValue() as string[] | undefined) ?? [];
    const selectedTable = tableNameFilter.length === 1 ? tableNameFilter[0] : "_all";

    const changeTypeFilter =
        (table.getColumn("change_type")?.getFilterValue() as string[] | undefined) ?? [];
    const selectedChangeType =
        changeTypeFilter.length === 1 ? changeTypeFilter[0] : "_all";

    const changeOwnerFilter =
        (table.getColumn("change_owner")?.getFilterValue() as string[] | undefined) ?? [];
    const selectedChangeOwner =
        changeOwnerFilter.length === 1 ? changeOwnerFilter[0] : "_all";

    const setTableFilter = (value: string) => {
        table.getColumn("table_name")?.setFilterValue(value && value !== "_all" ? [value] : undefined);
    };

    const setChangeTypeFilter = (value: string) => {
        table.getColumn("change_type")?.setFilterValue(value && value !== "_all" ? [value] : undefined);
    };

    const setChangeOwnerFilter = (value: string) => {
        table.getColumn("change_owner")?.setFilterValue(value && value !== "_all" ? [value] : undefined);
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

    return (
        <div className="flex flex-col gap-2 w-full p-3 sm:p-4">
            <div className="w-full">
                <ChangeLogSearch
                    onSearch={onSearchChange}
                    searchValue={searchValue}
                    className="relative w-96 max-w-full min-w-0 sm:w-[28rem]"
                />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <QuickGroup label="Tarih">
                    <Select
                        value={datePreset}
                        onValueChange={(v) => onDatePresetChange(v as ChangeLogDatePreset)}
                    >
                        <SelectTrigger className="h-8 w-full min-w-[160px] max-w-[220px] text-xs">
                            <SelectValue placeholder="Tüm zamanlar" />
                        </SelectTrigger>
                        <SelectContent>
                            {DATE_PRESET_SELECT.map(({ value, label }) => (
                                <SelectItem key={value} value={value} className="text-xs">
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </QuickGroup>

                <QuickGroup label="Kaynak tablo">
                    <Select value={selectedTable} onValueChange={setTableFilter}>
                        <SelectTrigger className="h-8 w-full min-w-[160px] max-w-[220px] text-xs">
                            <SelectValue placeholder="Tüm tablolar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all" className="text-xs">
                                Tüm tablolar
                            </SelectItem>
                            {CHANGE_LOG_TABLE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </QuickGroup>

                <QuickGroup label="İşlem tipi">
                    <Select value={selectedChangeType} onValueChange={setChangeTypeFilter}>
                        <SelectTrigger className="h-8 w-full min-w-[160px] max-w-[220px] text-xs">
                            <SelectValue placeholder="Tüm işlemler" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all" className="text-xs">
                                Tüm işlemler
                            </SelectItem>
                            {CHANGE_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </QuickGroup>

                <QuickGroup label="Düzenleyen">
                    <Select value={selectedChangeOwner} onValueChange={setChangeOwnerFilter}>
                        <SelectTrigger className="h-8 w-full min-w-[160px] max-w-[220px] text-xs">
                            <SelectValue placeholder="Tüm düzenleyenler" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all" className="text-xs">
                                Tüm düzenleyenler
                            </SelectItem>
                            {changeOwnerOptions.map((owner) => (
                                <SelectItem key={owner} value={owner} className="text-xs">
                                    {owner}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </QuickGroup>
            </div>

            {hasAnyFilter ? (
                <div className="flex justify-end pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-dashed gap-1.5 text-xs"
                        onClick={resetAll}
                    >
                        <X className="h-3.5 w-3.5 shrink-0" />
                        Tüm filtreleri temizle
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
