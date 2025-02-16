"use client";

import { CustomDataTable } from "@/components/custom-components/custom-data-table";
import { columns } from "./components/columns";
import { useChangeLogs } from "@/hooks/useChangeLogs";

export default function ChangeLogsPage() {
  const { data = [] } = useChangeLogs();

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
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
} 