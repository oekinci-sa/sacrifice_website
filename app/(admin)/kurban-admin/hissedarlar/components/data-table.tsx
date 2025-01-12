"use client";

import * as React from "react";
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Hissedar ara..."
            value={(table.getColumn("shareholder_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("shareholder_name")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          {table.getColumn("payment_status") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                  Ödeme Durumu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  key="paid"
                  className="capitalize"
                  checked={(table.getColumn("payment_status")?.getFilterValue() as string[])?.includes("paid")}
                  onCheckedChange={(checked) => {
                    const filterValues = table.getColumn("payment_status")?.getFilterValue() as string[] ?? [];
                    if (checked) {
                      table.getColumn("payment_status")?.setFilterValue([...filterValues, "paid"]);
                    } else {
                      table.getColumn("payment_status")?.setFilterValue(filterValues.filter((val) => val !== "paid"));
                    }
                  }}
                >
                  Tamamlandı
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  key="pending"
                  className="capitalize"
                  checked={(table.getColumn("payment_status")?.getFilterValue() as string[])?.includes("pending")}
                  onCheckedChange={(checked) => {
                    const filterValues = table.getColumn("payment_status")?.getFilterValue() as string[] ?? [];
                    if (checked) {
                      table.getColumn("payment_status")?.setFilterValue([...filterValues, "pending"]);
                    } else {
                      table.getColumn("payment_status")?.setFilterValue(filterValues.filter((val) => val !== "pending"));
                    }
                  }}
                >
                  Bekliyor
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {table.getColumn("delivery_type") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                  Teslimat Tipi
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  key="kesimhane"
                  className="capitalize"
                  checked={(table.getColumn("delivery_type")?.getFilterValue() as string[])?.includes("kesimhane")}
                  onCheckedChange={(checked) => {
                    const filterValues = table.getColumn("delivery_type")?.getFilterValue() as string[] ?? [];
                    if (checked) {
                      table.getColumn("delivery_type")?.setFilterValue([...filterValues, "kesimhane"]);
                    } else {
                      table.getColumn("delivery_type")?.setFilterValue(filterValues.filter((val) => val !== "kesimhane"));
                    }
                  }}
                >
                  Kesimhane
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  key="toplu-teslimat"
                  className="capitalize"
                  checked={(table.getColumn("delivery_type")?.getFilterValue() as string[])?.includes("toplu-teslimat")}
                  onCheckedChange={(checked) => {
                    const filterValues = table.getColumn("delivery_type")?.getFilterValue() as string[] ?? [];
                    if (checked) {
                      table.getColumn("delivery_type")?.setFilterValue([...filterValues, "toplu-teslimat"]);
                    } else {
                      table.getColumn("delivery_type")?.setFilterValue(filterValues.filter((val) => val !== "toplu-teslimat"));
                    }
                  }}
                >
                  Toplu Teslimat
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
} 