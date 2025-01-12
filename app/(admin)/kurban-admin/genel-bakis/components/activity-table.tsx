"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Cross2Icon, PlusCircledIcon, TrashIcon, UpdateIcon, MixerHorizontalIcon, DoubleArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";

interface ActivityLog {
  id: string;
  table_name: string;
  row_id: string;
  description: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  changed_at: string;
  change_owner: string;
}

interface ActivityTableProps {
  data: ActivityLog[];
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

export function ActivityTable({ data }: ActivityTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Benzersiz tablo isimlerini al
  const uniqueTables = Array.from(new Set(data.map(item => item.table_name)));

  // Filtreleme
  const filteredData = data.filter(item => {
    const matchesSearch = searchTerm === "" || 
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.change_owner?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesOperation = !selectedOperation || selectedOperation === "all" || item.operation === selectedOperation;
    const matchesTable = !selectedTable || selectedTable === "all" || item.table_name === selectedTable;

    return matchesSearch && matchesOperation && matchesTable;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Sayfa değiştirme fonksiyonu
  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  // Operation renklerini belirle
  const getOperationColor = (operation: string) => {
    switch (operation) {
      case "INSERT":
        return "text-green-600";
      case "UPDATE":
        return "text-blue-600";
      case "DELETE":
        return "text-red-600";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="İşlem açıklaması veya kullanıcı ara..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              onClick={() => setSearchTerm("")}
              className="h-8 px-2 lg:px-3"
            >
              Temizle
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed">
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                İşlem Türü
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>İşlem Seç</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={!selectedOperation || selectedOperation === "all"}
                onCheckedChange={() => {
                  setSelectedOperation("all");
                  setCurrentPage(1);
                }}
              >
                Tümü
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedOperation === "INSERT"}
                onCheckedChange={() => {
                  setSelectedOperation("INSERT");
                  setCurrentPage(1);
                }}
              >
                <PlusCircledIcon className="mr-2 h-4 w-4 text-green-600" />
                Ekleme
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedOperation === "UPDATE"}
                onCheckedChange={() => {
                  setSelectedOperation("UPDATE");
                  setCurrentPage(1);
                }}
              >
                <UpdateIcon className="mr-2 h-4 w-4 text-blue-600" />
                Güncelleme
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedOperation === "DELETE"}
                onCheckedChange={() => {
                  setSelectedOperation("DELETE");
                  setCurrentPage(1);
                }}
              >
                <TrashIcon className="mr-2 h-4 w-4 text-red-600" />
                Silme
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed">
                <MixerHorizontalIcon className="mr-2 h-4 w-4" />
                Tablo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>Tablo Seç</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={!selectedTable || selectedTable === "all"}
                onCheckedChange={() => {
                  setSelectedTable("all");
                  setCurrentPage(1);
                }}
              >
                Tümü
              </DropdownMenuCheckboxItem>
              {uniqueTables.map((table) => (
                <DropdownMenuCheckboxItem
                  key={table}
                  checked={selectedTable === table}
                  onCheckedChange={() => {
                    setSelectedTable(table);
                    setCurrentPage(1);
                  }}
                >
                  {table}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>İşlem</TableHead>
              <TableHead>Tablo</TableHead>
              <TableHead className="w-[400px]">Açıklama</TableHead>
              <TableHead>Kullanıcı</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {format(new Date(item.changed_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                </TableCell>
                <TableCell className={getOperationColor(item.operation)}>
                  {item.operation}
                </TableCell>
                <TableCell>{item.table_name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.change_owner}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {filteredData.length} sonuçtan {startIndex + 1} - {Math.min(startIndex + pageSize, filteredData.length)} arası gösteriliyor.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Sayfa başına</p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Sayfa {currentPage} / {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">İlk sayfa</span>
              <DoubleArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Önceki sayfa</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Sonraki sayfa</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Son sayfa</span>
              <DoubleArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 