"use client"

import { TableHeader, TableRow } from "@/components/ui/table"
import { Table as TableInstance, flexRender } from "@tanstack/react-table"
import { motion } from "framer-motion"
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
    large: "h-14 text-center text-sm md:text-lg py-3"
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
            <motion.th
              key={header.id}
              layout
              layoutId={`th-${header.column.id}`}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={(header.column.columnDef as { minSize?: number }).minSize != null
                ? { minWidth: `${(header.column.columnDef as { minSize?: number }).minSize}px` }
                : undefined}
              className={`h-10 px-2 text-left align-middle font-medium text-muted-foreground font-sans whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] ${headerClass}`}
            >
              {header.isPlaceholder ? null : (
                <div className="flex items-center justify-center gap-2">
                  {typeof header.column.columnDef.header === "string" ? (
                    header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex items-center gap-2 cursor-pointer rounded hover:bg-muted hover:text-foreground px-1 -mx-1"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.column.columnDef.header}
                        {header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className={arrowClass} />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className={arrowClass} />
                        ) : (
                          <ArrowUpDown className={arrowClass} />
                        )}
                      </button>
                    ) : (
                      <>
                        {header.column.columnDef.header}
                      </>
                    )
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                  )}
                </div>
              )}
            </motion.th>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  )
} 