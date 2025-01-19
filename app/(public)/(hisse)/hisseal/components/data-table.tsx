"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { sacrificeSchema } from "@/types";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onSacrificeSelect: (sacrifice: sacrificeSchema) => void;
}

const share_prices = [
  { label: "30000", value: "30000" },
  { label: "32000", value: "32000" },
  { label: "34000", value: "34000" },
  { label: "36000", value: "36000" },
  { label: "38000", value: "38000" },
  { label: "40000", value: "40000" },
];

const empty_shares = [
  { label: "0", value: "0" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "7", value: "7" },
];

export function DataTable<TData, TValue>({
  columns,
  data,
  onSacrificeSelect,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    {
      id: "empty_share",
      value: ["1", "2", "3", "4", "5", "6", "7"]
    }
  ]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      onSacrificeSelect,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      }
    },
  });

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-heading text-2xl">Kurbanlık Seçim Tablosu</h2>
        <p className="text-muted-foreground">
          Kurbanlık seçimlerinizi yaparken sütun adlarına tıklayarak sıralama yapabilir ve filtreleri kullanarak sadece istediğiniz kurbanlıklarının görüntülenmesini sağlayabilirsiniz.
        </p>
      </div>

      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => setColumnFilters([])}
              className="h-8 px-2 lg:px-3"
            >
              Sıfırla
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
          {table.getColumn("share_price") && (
            <DataTableFacetedFilter
              column={table.getColumn("share_price")}
              title="Hisse Bedeli"
              options={share_prices}
            />
          )}
          {table.getColumn("empty_share") && (
            <DataTableFacetedFilter
              column={table.getColumn("empty_share")}
              title="Boş Hisse"
              options={empty_shares}
            />
          )}
        </div>
      </div>

      <div className="border-t border-b">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-center p-0">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-transparent border-b last:border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center py-4 text-sm font-medium">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Toplam {table.getFilteredRowModel().rows.length} kurbanlık mevcut
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Sayfa başına</p>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm font-medium">kayıt</p>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Sayfa {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            İlk Sayfa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sonraki
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            Son Sayfa
          </Button>
        </div>
      </div>
    </div>
  );
} 