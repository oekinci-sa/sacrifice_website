"use client";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Column, Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PlusCircle } from "lucide-react";
import { useMemo } from "react";
import { ChangeLog } from "./columns";

// Filter Badge component for mobile
const FilterCountBadge = ({ count }: { count: number }) =>
    count > 0 ? (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs md:hidden">
            {count}
        </div>
    ) : null;

// Component to display selected filters
const SelectedFiltersDisplay = ({
    selectedValues,
    options,
}: {
    selectedValues: Set<string>;
    options: { label: string; value: string }[];
}) => {
    if (selectedValues.size === 0) return null;

    // Sort selected values
    const sortedValues = Array.from(selectedValues).sort((a, b) => a.localeCompare(b));

    // Always display all selected values regardless of count
    return (
        <div className="hidden md:flex gap-1 ml-2 flex-wrap max-w-[300px]">
            <AnimatePresence>
                {sortedValues.map((value, index) => {
                    const option = options.find((opt) => opt.value === value);
                    return option ? (
                        <motion.span
                            key={value}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-[#f4f4f5] text-xs px-2 py-0.5 truncate max-w-[100px]"
                            title={option.label}
                        >
                            {option.label}
                        </motion.span>
                    ) : null;
                })}
            </AnimatePresence>
        </div>
    );
};

// Faceted filter component
function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
}: {
    column?: Column<TData, TValue>;
    title?: string;
    options: { label: string; value: string }[];
}) {
    const selectedValues = new Set(column?.getFilterValue() as string[]);
    const facets = column?.getFacetedUniqueValues();

    const handleSelect = (value: string) => {
        const newSelectedValues = new Set(selectedValues);
        if (newSelectedValues.has(value)) {
            newSelectedValues.delete(value);
        } else {
            newSelectedValues.add(value);
        }
        const filterValues = Array.from(newSelectedValues);
        column?.setFilterValue(
            filterValues.length ? filterValues : undefined
        );
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-dashed text-xs whitespace-nowrap flex items-center justify-start"
                >
                    <PlusCircle className="mr-2 h-3 w-3 shrink-0" />
                    {title}
                    <SelectedFiltersDisplay
                        selectedValues={selectedValues}
                        options={options}
                    />
                    <FilterCountBadge count={selectedValues.size} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => handleSelect(option.value)}
                                        className="cursor-pointer"
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <span>{option.label}</span>
                                        {facets?.get(option.value) && (
                                            <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                                                {facets.get(option.value)}
                                            </span>
                                        )}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface ChangeLogFiltersProps {
    table: Table<ChangeLog>;
}

export function ChangeLogFilters({ table }: ChangeLogFiltersProps) {
    // Generate table name options from the data
    const tableNameOptions = useMemo(() => {
        const tableNames = new Set<string>();

        table.getPreFilteredRowModel().rows.forEach((row) => {
            const tableName = row.original.table_name;
            if (tableName) {
                tableNames.add(tableName);
            }
        });

        return Array.from(tableNames)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => {
                let displayName = name;
                if (name === "sacrifice_animals") displayName = "Kurbanlıklar";
                if (name === "shareholders") displayName = "Hissedarlar";

                return {
                    label: displayName,
                    value: name,
                };
            });
    }, [table]);

    // Operation type options
    const operationTypeOptions = useMemo(() => [
        { label: "Ekleme", value: "Ekleme" },
        { label: "Güncelleme", value: "Güncelleme" },
        { label: "Silme", value: "Silme" }
    ], []);

    // Generate change owner options from the data
    const changeOwnerOptions = useMemo(() => {
        const owners = new Set<string>();

        table.getPreFilteredRowModel().rows.forEach((row) => {
            const owner = row.original.change_owner;
            if (owner) {
                owners.add(owner);
            }
        });

        return Array.from(owners)
            .sort((a, b) => a.localeCompare(b))
            .map((owner) => ({
                label: owner,
                value: owner,
            }));
    }, [table]);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <DataTableFacetedFilter
                column={table.getColumn("table_name")}
                title="Tablo"
                options={tableNameOptions}
            />
            <DataTableFacetedFilter
                column={table.getColumn("change_type")}
                title="İşlem Tipi"
                options={operationTypeOptions}
            />
            <DataTableFacetedFilter
                column={table.getColumn("change_owner")}
                title="Düzenleyen"
                options={changeOwnerOptions}
            />
        </div>
    );
} 