"use client";

import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { useEffect, useState, useMemo } from "react";
import { ShareholderSearch } from "./components/shareholder-search";
import { useGetShareholders } from "@/hooks/useShareholders";
import { shareholderSchema } from "@/types";
import { columns } from "./components/columns";
import { Button } from "@/components/ui/button";
import { Download, SlidersHorizontal, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VisibilityState } from "@tanstack/react-table";
import { ShareholderFilters } from "./components/shareholder-filters";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TumHissedarlarPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Default column visibility - hide security_code and notes by default
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    security_code: false,
    notes: false,
  });

  // Pass column visibility to the table initialState
  useEffect(() => {
    // This is just to ensure the initialState is respected
    console.log("Column visibility set:", columnVisibility);
  }, [columnVisibility]);

  // Column header mapping for dropdown - more descriptive names
  const columnHeaderMap: { [key: string]: string } = {
    shareholder_name: "İsim Soyisim",
    phone_number: "Telefon",
    "sacrifice.sacrifice_no": "Kurban No",
    share_count: "Hisse Sayısı",
    total_amount: "Toplam Tutar",
    paid_amount: "Ödenen Tutar",
    payment_status: "Ödeme Durumu",
    remaining_payment: "Kalan Ödeme",
    delivery_location: "Teslimat Noktası",
    security_code: "Güvenlik Kodu",
    notes: "Notlar",
  };
  
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
      
      // Search in notes
      if (shareholder.notes?.toLowerCase().includes(lowercasedSearch)) {
        return true;
      }
      
      // Search only in the fields above, not in other columns
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

  // Filters component for the CustomDataTable
  const FiltersComponent = ({ table, columnFilters, onColumnFiltersChange }: { 
    table: any, 
    columnFilters: any,
    onColumnFiltersChange: (filters: any) => void
  }) => {
    const [isFiltered, setIsFiltered] = useState(false);

    // Check if any filters are active
    useEffect(() => {
      const hasColumnFilters = columnFilters.length > 0;
      setIsFiltered(hasColumnFilters);
    }, [columnFilters]);

    // Handle reset all filters
    const handleResetFilters = () => {
      table.resetColumnFilters();
      onColumnFiltersChange([]);
    };

    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {/* Filter components */}
          <ShareholderFilters table={table} />
          
          {/* Columns dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Sütunlar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(
                  (column: any) =>
                    typeof column.accessorFn !== "undefined" && column.getCanHide()
                )
                .map((column: any) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {columnHeaderMap[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Reset filters button - after columns button */}
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
        
        {/* Export to Excel button - on the far right */}
        <Button onClick={exportToExcel} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Excel'e Aktar
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tüm Hissedarlar</h1>
        <p className="text-muted-foreground">
          Sistemde kayıtlı tüm hissedarların listesi
        </p>
      </div>

      <div className="flex items-center justify-between">
        <ShareholderSearch onSearch={handleSearch} />
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
          columns={columns}
          data={filteredShareholders}
          initialState={{
            columnVisibility: columnVisibility
          }}
          filters={({ table, columnFilters, onColumnFiltersChange }) => (
            <FiltersComponent table={table} columnFilters={columnFilters} onColumnFiltersChange={onColumnFiltersChange} />
          )}
        />
      )}
    </div>
  );
} 