"use client";

import { Row } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DataTableRowActionsProps<TData extends { sacrifice_no: number }> {
  row: Row<TData>;
}

export function DataTableRowActions<TData extends { sacrifice_no: number }>({
  row,
}: DataTableRowActionsProps<TData>) {
  const data = row.original;

  return (
    <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity relative z-50">
      <Link href={`/kurban-admin/kurbanliklar/ayrintilar/${data.sacrifice_no}`}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
