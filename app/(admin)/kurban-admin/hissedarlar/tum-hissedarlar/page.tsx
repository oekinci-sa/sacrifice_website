"use client";

import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { useEffect, useState, useMemo } from "react";
import { ShareholderSearch } from "./components/shareholder-search";
import { useGetShareholders } from "@/hooks/useShareholders";
import { shareholderSchema } from "@/types";
import { columns } from "./components/columns";
import { CustomTableHeader } from "@/components/custom-components/custom-table-header";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TumHissedarlarPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Get all shareholders without filtering at the database level
  const { data: allShareholders, isLoading, error } = useGetShareholders();
  
  // Filter the data client-side based on search term
  const filteredShareholders = useMemo(() => {
    if (!allShareholders || !searchTerm.trim()) {
      return allShareholders || [];
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    
    return allShareholders.filter(shareholder => {
      // Search in shareholder name
      if (shareholder.shareholder_name?.toLowerCase().includes(lowercasedSearch)) {
        return true;
      }
      
      // Search in phone number
      if (shareholder.phone_number?.includes(lowercasedSearch)) {
        return true;
      }
      
      // Search in sacrifice number
      if (shareholder.sacrifice?.sacrifice_no?.toString().includes(lowercasedSearch)) {
        return true;
      }
      
      return false;
    });
  }, [allShareholders, searchTerm]);
  
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const exportToExcel = () => {
    // Export functionality can be implemented here
    // You'll need to convert the shareholders data to Excel format
  };

  if (error) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Tüm Hissedarlar</h1>
        <div className="bg-red-50 p-4 rounded-md text-red-500">
          Hissedar verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tüm Hissedarlar</h1>
        <Button onClick={exportToExcel} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Excel'e Aktar
        </Button>
      </div>
      
      <ShareholderSearch onSearch={handleSearch} />

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
          columns={columns}
          data={filteredShareholders}
        />
      )}
    </div>
  );
} 