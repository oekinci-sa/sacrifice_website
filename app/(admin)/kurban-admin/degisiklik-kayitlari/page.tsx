"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangeLogs } from "@/hooks/useChangeLogs";
import { useMemo, useState } from "react";
import { ChangeLogFilters } from "./components/change-log-filters";
import { ChangeLogSearch } from "./components/change-log-search";
import { columns } from "./components/columns";

export default function ChangeLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data = [], isLoading, error } = useChangeLogs();

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return data.filter(log => {
      const description = log.description?.toLowerCase() || '';
      return description.includes(lowerCaseSearch);
    });
  }, [data, searchTerm]);

  const handleSearch = (value: string) => setSearchTerm(value);

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
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight mt-0">Değişiklik Kayıtları</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Kurbanlık ve hissedar değişiklik geçmişini inceleyebilirsiniz.
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
          data={filteredData}
          columns={columns}
          pageSizeOptions={[10, 20, 50, 100]}
          tableSize="medium"
          filters={({ table }) => (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <ChangeLogFilters table={table} />
              <ChangeLogSearch onSearch={handleSearch} />
            </div>
          )}
        />
      )}
    </div>
  );
} 