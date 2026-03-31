"use client"

import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { ColumnDef, Table as TableInstance, flexRender } from "@tanstack/react-table"
import { motion } from "framer-motion"

interface CustomTableBodyProps<TData, TValue> {
  table: TableInstance<TData>
  columns: ColumnDef<TData, TValue>[]
  tableSize?: "small" | "medium" | "large"
  renderExpandedRow?: (row: { original: TData }) => React.ReactNode | null
}

export function CustomTableBody<TData, TValue>({
  table,
  columns,
  tableSize = "medium",
  renderExpandedRow,
}: CustomTableBodyProps<TData, TValue>) {
  const rowSizeClasses = {
    small: "text-[10px] md:text-xs",
    medium: "text-xs md:text-sm",
    large: "text-[14px] md:text-lg"
  }

  const rowClass = rowSizeClasses[tableSize]

  return (
    <TableBody>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row, index) => (
          <>
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
              data-state={row.getIsSelected() && "selected"}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              {row.getVisibleCells().map((cell) => (
                <motion.td
                  key={cell.id}
                  layout
                  layoutId={`td-${cell.column.id}-${row.id}`}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={(cell.column.columnDef as { minSize?: number }).minSize != null
                    ? { minWidth: `${(cell.column.columnDef as { minSize?: number }).minSize}px` }
                    : undefined}
                  className={`p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] ${(cell.column.columnDef.meta as { align?: string })?.align === "left" ? "text-left" : "text-center"} whitespace-nowrap font-sans ${rowClass}`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </motion.td>
              ))}
            </motion.tr>
            {renderExpandedRow ? renderExpandedRow({ original: row.original }) : null}
          </>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columns.length} className={`h-24 text-center font-sans ${rowClass}`}>
            Kayıt bulunamadı.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}
