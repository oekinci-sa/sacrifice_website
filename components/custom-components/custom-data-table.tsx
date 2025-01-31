"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  VisibilityState,
  SortingState,
  Column,
  Table as TableInstance,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Pencil, Eye } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter"
import { supabase } from "@/utils/supabaseClient"
import { columnIcon } from "@/app/(admin)/kurban-admin/degisiklik-kayitlari/components/columns"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: Record<string, any>
  pageSizeOptions?: number[]
  filters?: (props: { 
    table: TableInstance<TData>;
    columnFilters: ColumnFiltersState;
    onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  }) => React.ReactNode | null
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
  }[];
  facets?: Map<any, number>;
}

export function CustomDataTable<TData, TValue>({
  columns,
  data,
  meta,
  pageSizeOptions = [10, 20, 50, 100, 150],
  filters,
}: DataTableProps<TData, TValue>) {
  const tableColumns = React.useMemo(() => columns, [columns])
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    {
      id: "empty_share",
      value: ["1", "2", "3", "4", "5", "6", "7"]
    }
  ])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    notes: false,
  })
  const [{ pageIndex, pageSize }, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[0],
  })
  const [sharePrices, setSharePrices] = React.useState<{ label: string; value: string }[]>([])

  const emptyShares = React.useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      label: i.toString(),
      value: i.toString()
    }))
  , []);

  const table = useReactTable({
    data,
    columns: tableColumns,
    meta,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  })

  const sharePriceFacets = table.getColumn("share_price")?.getFacetedUniqueValues();
  const emptyShareFacets = table.getColumn("empty_share")?.getFacetedUniqueValues();

  React.useEffect(() => {
    const fetchSharePrices = async () => {
      const { data: prices } = await supabase
        .from("sacrifice_animals")
        .select("share_price")
        .order("share_price", { ascending: true });

      if (prices) {
        const uniquePrices = Array.from(new Set(prices.map((p) => p.share_price)));
        const options = uniquePrices.map((price) => ({
          label: `${new Intl.NumberFormat('tr-TR', { 
            style: 'decimal',
            maximumFractionDigits: 0 
          }).format(price)} ₺`,
          value: price.toString(),
        }));
        setSharePrices(options);
      }
    };

    fetchSharePrices();
  }, []);

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="mt-8">
      <div className="space-y-4">
        {typeof filters === 'function' ? filters({ 
          table,
          columnFilters,
          onColumnFiltersChange: setColumnFilters
        }) : null}

        <div className="rounded-md">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      className="h-12 text-center w-[200px]"
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            className="h-8 px-2 flex items-center gap-2 hover:bg-muted"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {typeof header.column.columnDef.header === "string" ? (
                              <div className="flex items-center gap-2">
                                <span>{header.column.columnDef.header}</span>
                                {header.column.getCanSort() && (
                                  header.column.getIsSorted() === "asc" ? (
                                    <ArrowUp className="h-4 w-4" />
                                  ) : header.column.getIsSorted() === "desc" ? (
                                    <ArrowDown className="h-4 w-4" />
                                  ) : (
                                    <ArrowUpDown className="h-4 w-4" />
                                  )
                                )}
                              </div>
                            ) : (
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )
                            )}
                          </Button>
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-center h-10 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                    Kayıt bulunamadı.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Table Footer */}
        <div className="flex items-center justify-between">
          {/* Row Number */}
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Sayfa başına satır</p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPagination(prev => ({ ...prev, pageSize: Number(value) }))
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-muted border-0">
                <SelectValue placeholder={pageSize.toString()} />
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
      </div>
    </div>
  )
}