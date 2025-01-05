"use client";

import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

import Link from "next/link";

interface DataTableRowActionsProps<TData extends { sacrifice_no: number }> {
  row: Row<TData>;
}

export function DataTableRowActions<TData extends { sacrifice_no: number }>({
  row,
}: DataTableRowActionsProps<TData>) {
  // kullanılarak satır verisi belirli bir yapıya uygun hale getiriliyor.
  const data = row.original;
  console.log(data);

  return (
    <Link href={`/kurban-admin/kurbanliklar/ayrintilar/${data.sacrifice_no}`}>
      <Button>Düzenle</Button>
    </Link>
  );
}
