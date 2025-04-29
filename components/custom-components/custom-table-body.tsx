"use client"

import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { ColumnDef, Table as TableInstance, flexRender } from "@tanstack/react-table"

interface CustomTableBodyProps<TData, TValue> {
  table: TableInstance<TData>
  columns: ColumnDef<TData, TValue>[]
  tableSize?: "small" | "medium" | "large"
}

export function CustomTableBody<TData, TValue>({
  table,
  columns,
  tableSize = "medium"
}: CustomTableBodyProps<TData, TValue>) {
  // Define row size classes based on header size
  const rowSizeClasses = {
    small: "text-[10px] md:text-xs",
    medium: "text-xs md:text-sm",
    large: "text-[14px] md:text-lg"
  }

  // Get the appropriate class for current size
  const rowClass = rowSizeClasses[tableSize]

  return (
    <TableBody>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() && "selected"}
            className="hover:bg-muted/50"
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={`text-center whitespace-nowrap ${rowClass}`}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columns.length} className={`h-24 text-center ${rowClass}`}>
            Kayıt bulunamadı.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
} 