"use client"

import * as React from "react"
import { Table as TableInstance, flexRender } from "@tanstack/react-table"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"

interface CustomTableHeaderProps<TData> {
  table: TableInstance<TData>
}

export function CustomTableHeader<TData>({ table }: CustomTableHeaderProps<TData>) {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead 
              key={header.id} 
              className="h-12 text-center text-base md:text-lg py-2"
            >
              {header.isPlaceholder ? null : (
                <div className="flex items-center justify-center gap-2">
                  {typeof header.column.columnDef.header === "string" ? (
                    <>
                      {header.column.columnDef.header}
                      {header.column.getCanSort() && (
                        <span 
                          className="p-1 cursor-pointer rounded hover:bg-muted"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                  )}
                </div>
              )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  )
} 