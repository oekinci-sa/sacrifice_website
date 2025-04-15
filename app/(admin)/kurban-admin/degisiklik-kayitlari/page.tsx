"use client";

import { useState, useMemo } from "react";
import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { columns } from "./components/columns";
import { useChangeLogs } from "@/hooks/useChangeLogs";
import { ChangeLogSearch } from "./components/change-log-search";
import { Skeleton } from "@/components/ui/skeleton";

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
        <h1 className="text-2xl font-semibold tracking-tight">Değişiklik Kayıtları</h1>
        <p className="text-muted-foreground">
          Sistemde yapılan tüm değişikliklerin kayıtları
        </p>
      </div>

      <div className="flex items-center justify-between">
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
        />
      )}
    </div>
  );
} 