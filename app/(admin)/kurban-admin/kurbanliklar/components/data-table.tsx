"use client";

import * as React from "react";
// Tanstack Table kütüphanesinden gerekli bileşenler alınır.
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

// Shadcn table bileşenleri alınır.
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

// Tablo bileşeni, herhangi bir türdeki veri ve kolon yapılarına uyacak şekilde tasarlanmıştır.
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]; // Tablonun kolon tanımları.
  data: TData[]; // Tablo verisi.
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // Seçili satırların durumunu tutar.
  const [rowSelection, setRowSelection] = React.useState({});


  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  
  // Kolon filtre durumlarını tutar.
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  // Sıralama durumunu tutar.
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Tablo bileşenini oluşturur.
  const table = useReactTable({
    // Tablo verisi ve kolon tanımlarını alır.
    data,
    // Tablo kolonlarını alır.

    columns,
    // Tablo durumlarını alır.
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },

    // Tablo durumlarını günceller.
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,

    // Temel tablo modelini oluşturur.
    getCoreRowModel: getCoreRowModel(),

    // Filtrelenmiş tablo modelini oluşturur.
    getFilteredRowModel: getFilteredRowModel(),

    // Sayfalı tablo modelini oluşturur.
    getPaginationRowModel: getPaginationRowModel(),

    // Sıralanmış tablo modelini oluşturur.
    getSortedRowModel: getSortedRowModel(),

    // Fasit tablo modelini oluşturur.
    getFacetedRowModel: getFacetedRowModel(),

    // Fasit benzersiz değerleri alır.
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      {/* Tablo araç çubuğunu oluşturur. */}
      <DataTableToolbar table={table} />

      {/* Tablo bileşenini oluşturur. */}
      <div className="rounded-sm border">
        <Table>
          {/* Tablo başlıklarını oluşturur. */}
          <TableHeader>
            {/* Kolon başlıklarını gruplar halinde alır. */}
            {table.getHeaderGroups().map((headerGroup) => (
              // Her bir kolon başlığını oluşturur.
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    // Her bir kolon başlığını oluşturur.
                    <TableHead key={header.id} colSpan={header.colSpan} className="bg-primary">
                      {/* Kolon başlığı yer tutucu ise, başlık oluşturmaz. */}
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
          {/* Satırları oluşturur. */}
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="group"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.columnDef.size }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center"
            >
              Gösterilecek sonuç yok.
            </TableCell>
            </TableRow>
          )}
          </TableBody>
        </Table>
      </div>

      {/* Tablo sayfalama bileşenini oluşturur. */}
      <DataTablePagination table={table} />
    </div>
  );
}
