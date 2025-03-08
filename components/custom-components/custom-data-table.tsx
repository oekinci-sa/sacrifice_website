"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
  SortingState,
  Table as TableInstance,
} from "@tanstack/react-table"

import { Table } from "@/components/ui/table"
import { supabase } from "@/utils/supabaseClient"
import { CustomDataTableFooter } from "./custom-data-table-footer"
import { CustomTableHeader } from "./custom-table-header"
import { CustomTableBody } from "./custom-table-body"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: Record<string, unknown>
  pageSizeOptions?: number[]
  filters?: (props: { 
    table: TableInstance<TData>;
    columnFilters: ColumnFiltersState;
    onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  }) => React.ReactNode | null
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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    notes: false,
  })
  const [{ pageIndex, pageSize }, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[0],
  })

  // Reset page index when page size changes
  React.useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }, [pageSize])

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

  React.useEffect(() => {
    const fetchSharePrices = async () => {
      const { data: prices } = await supabase
        .from("sacrifice_animals")
        .select("share_price")
        .order("share_price", { ascending: true });

      if (prices) {
        const uniquePrices = Array.from(new Set(prices.map((p) => p.share_price)));
        // Store prices in state if needed for future use
        uniquePrices.map((price) => ({
          label: `${new Intl.NumberFormat('tr-TR', { 
            style: 'decimal',
            maximumFractionDigits: 0 
          }).format(price)} ₺`,
          value: price.toString(),
        }));
      }
    };

    fetchSharePrices();
  }, []);

  return (
    <div>
      <div className="space-y-4">
        {typeof filters === 'function' ? filters({ 
          table,
          columnFilters,
          onColumnFiltersChange: setColumnFilters
        }) : null}

        <div className="rounded-md">
          <Table>
            <CustomTableHeader table={table} />
            <CustomTableBody table={table} columns={tableColumns} />
          </Table>
        </div>
        
        {/* Table Footer */}
        <CustomDataTableFooter 
          table={table}
          pageSizeOptions={pageSizeOptions}
        />
      </div>
    </div>
  )
}