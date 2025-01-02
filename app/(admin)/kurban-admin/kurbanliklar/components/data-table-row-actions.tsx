"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";

interface DataTableRowActionsProps<TData extends { sacrifice_no: string }> {
  row: Row<TData>;
}

export function DataTableRowActions<TData extends { sacrifice_no: string }>({
  row,
}: DataTableRowActionsProps<TData>) {
  // kullanılarak satır verisi belirli bir yapıya uygun hale getiriliyor.
  const data = row.original;
  console.log(data);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <Link href={`/kurban-admin/kurbanliklar/ayrintilar/${data.sacrifice_no}`}>
          <Button>Hisse Al</Button>
        </Link>
        <DropdownMenuItem>Sil</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
