"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table as TableInstance } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface DataTableFooterProps<TData> {
  table: TableInstance<TData>
  pageSizeOptions: number[]
}

export function CustomDataTableFooter<TData>({
  table,
  pageSizeOptions = [10, 20, 50, 100, 150],
}: DataTableFooterProps<TData>) {
  return (
    <div className="space-y-4">
      {/* Desktop Table Footer */}
      <div className="hidden md:flex items-center justify-between">
        {/* Row Number */}
        <div className="flex items-center gap-2">
          <p className="text-sm md:text text-muted-foreground">Sayfa başına satır</p>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px] bg-muted border-0">
              <SelectValue placeholder={table.getState().pagination.pageSize.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Total Rows */}
        <div className="flex-1 text-center text-sm text-muted-foreground">
          Toplam {table.getFilteredRowModel().rows.length} adet sonuç bulundu.
        </div>
        {/* Pagination */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Sayfa {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Table Footer */}
      <div className="md:hidden space-y-4">
        {/* Total Rows */}
        <div className="text-center text-xs text-muted-foreground">
          Toplam {table.getFilteredRowModel().rows.length} adet sonuç bulundu.
        </div>

        <div className="flex justify-between">
          {/* Row Number */}
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">
              Sayfa başına
            </p>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">satır</span>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="ml-1 h-8 w-[48px] bg-muted border-0 text-[11px] px-1">
                  <SelectValue placeholder={table.getState().pagination.pageSize.toString()} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()} className="text-[10px] px-2">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pagination */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground text-center">
              Sayfa {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </div>
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-6 w-6 p-0"
              >
                <ChevronsLeft className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-6 w-6 p-0"
              >
                <ChevronsRight className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 