"use client";

import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangeLogs } from "@/hooks/useChangeLogs";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { ChangeLogFilters } from "./components/change-log-filters";
import { ChangeLogSearch } from "./components/change-log-search";
import { columns } from "./components/columns";

export default function ChangeLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch change logs using React Query
  const { data = [], isLoading, error } = useChangeLogs();

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const lowerCaseSearch = searchTerm.toLowerCase();

    return data.filter(log => {
      // Search only in the description column
      const description = log.description?.toLowerCase() || '';
      return description.includes(lowerCaseSearch);
    });
  }, [data, searchTerm]);

  // Create a table instance for filters
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters: [],
    },
  });

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  if (error) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Değişiklik Kayıtları</h1>
        <div className="bg-red-50 p-4 rounded-md text-red-500">
          Değişiklik kayıtları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mt-0">Değişiklik Kayıtları</h1>
        <p className="text-muted-foreground">
          Sistemde yapılan tüm değişikliklerin kayıtları
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <ChangeLogFilters table={table} />
        <ChangeLogSearch onSearch={handleSearch} />
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
          data={filteredData}
          columns={columns}
          pageSizeOptions={[10, 20, 50, 100]}
          tableSize="medium"
        />
      )}
    </div>
  );
} 