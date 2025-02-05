"use client";

import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { columns, type ChangeLog } from "./components/columns";
import { useChangeLogs } from "@/hooks/useChangeLogs";
import { DataTableFacetedFilter } from "@/components/custom-components/data-table-faceted-filter";
import { Table } from "@tanstack/react-table";
import type { ColumnFiltersState } from "@tanstack/react-table";

const filterOptions = [
  {
    id: "change_type",
    title: "İşlem Türü",
    options: [
      { label: "Ekleme", value: "Ekleme" },
      { label: "Güncelleme", value: "Güncelleme" },
      { label: "Silme", value: "Silme" },
    ],
  },
  {
    id: "table_name",
    title: "Tablo",
    options: [
      { label: "Kurbanlıklar", value: "sacrifice_animals" },
      { label: "Hissedarlar", value: "shareholders" },
      { label: "Kullanıcılar", value: "users" },
    ],
  },
];

interface TableFiltersProps {
  table: Table<ChangeLog>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
}

export default function ChangeLogsPage() {
  const { data = [] } = useChangeLogs();

  const TableFilters = ({ table }: TableFiltersProps) => (
    <div className="flex items-center gap-2">
      {filterOptions.map((filter) => (
        <DataTableFacetedFilter
          key={filter.id}
          column={table.getColumn(filter.id)}
          title={filter.title}
          options={filter.options}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Değişiklik Kayıtları</h1>
        <p className="text-muted-foreground">
          Sistemde yapılan tüm değişikliklerin kayıtları
        </p>
      </div>

      <CustomDataTable
        data={data}
        columns={columns}
        filters={TableFilters}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
} 