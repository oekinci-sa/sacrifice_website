"use client";

import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { shareholderSchema } from "@/types";
import { Row } from "@tanstack/react-table";
import { SacrificeMoveControl } from "../../components/sacrifice-move-control";

export function EditableSacrificeNumberCell({ row }: { row: Row<shareholderSchema> }) {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  return (
    <SacrificeMoveControl shareholder={row.original} selectedYear={selectedYear} layout="table" />
  );
}
