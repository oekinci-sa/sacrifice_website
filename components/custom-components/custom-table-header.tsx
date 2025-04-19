"use client"

import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Table as TableInstance, flexRender } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

interface CustomTableHeaderProps<TData> {
  table: TableInstance<TData>
  tableSize?: "small" | "medium" | "large"
}

export function CustomTableHeader<TData>({
  table,
  tableSize = "medium"
}: CustomTableHeaderProps<TData>) {
  // Define size classes based on header size
  const headerSizeClasses = {
    small: "h-10 text-center text-xs md:text-sm py-1",
    medium: "h-12 text-center text-sm md:text-md py-2",
    large: "h-14 text-center text-base md:text-lg py-3"
  }

  // Define arrow icon size classes
  const arrowSizeClasses = {
    small: "h-2 w-2 md:h-3 md:w-3",
    medium: "h-3 w-3 md:h-4 md:w-4",
    large: "h-4 w-4 md:h-5 md:w-5"
  }

  // Get the appropriate classes for current size
  const headerClass = headerSizeClasses[tableSize]
  const arrowClass = arrowSizeClasses[tableSize]

  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              className={headerClass}
            >
              {header.isPlaceholder ? null : (
                <div className="flex items-center justify-center gap-2">
                  {typeof header.column.columnDef.header === "string" ? (
                    <>
                      {header.column.columnDef.header}
                      {header.column.getCanSort() && (
                        <span
                          className="-ml-1 md:-ml-0 cursor-pointer rounded hover:bg-muted"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className={arrowClass} />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className={arrowClass} />
                          ) : (
                            <ArrowUpDown className={arrowClass} />
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