"use client"

import * as React from "react"
import { Table as TableInstance, flexRender, ColumnDef } from "@tanstack/react-table"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"

interface CustomTableBodyProps<TData, TValue> {
  table: TableInstance<TData>
  columns: ColumnDef<TData, TValue>[]
}

export function CustomTableBody<TData, TValue>({ 
  table, 
  columns 
}: CustomTableBodyProps<TData, TValue>) {
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
                className="text-center whitespace-nowrap"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
            Kayıt bulunamadı.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
} 