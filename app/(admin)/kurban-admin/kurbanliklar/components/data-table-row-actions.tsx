"use client";

import { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface SacrificeAnimal {
  sacrifice_id: string;
  sacrifice_no: string;
  empty_share: number;
  share_price: number;
  total_price: number;
  last_edited_time: string;
  last_edited_by: string;
  notes?: string;
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const sacrifice = row.original as SacrificeAnimal;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => router.push(`/kurban-admin/kurbanliklar/ayrintilar/${sacrifice.sacrifice_id}`)}
        >
          Detaylar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
