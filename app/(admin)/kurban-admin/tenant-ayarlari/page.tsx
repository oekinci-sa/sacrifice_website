"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { createColumns, type TenantSettingRow } from "./components/columns";
import { TenantSettingsEditDialog } from "./components/tenant-settings-edit-dialog";
import { AgreementEditDialog } from "./components/agreement-edit-dialog";
import { TenantSettingsToolbar } from "./components/tenant-settings-toolbar";

export default function TenantAyarlariPage() {
  const [data, setData] = useState<TenantSettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TenantSettingRow | null>(null);
  const [agreementRow, setAgreementRow] = useState<TenantSettingRow | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tenant-settings");
      if (!res.ok) throw new Error("Veriler alınamadı");
      const json = await res.json();
      setData(json.settings ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (row: TenantSettingRow) => {
    setEditingRow(row);
    setEditOpen(true);
  };

  const handleEditAgreement = (row: TenantSettingRow) => {
    setAgreementRow(row);
    setAgreementOpen(true);
  };

  const columns = createColumns(handleEdit, handleEditAgreement, fetchData);

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Organizasyon Ayarları</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Tüm  ayarlarını görüntüleyebilir ve düzenleyebilirsiniz. Yıl, kapora
          ve telefon tabloda doğrudan düzenlenebilir. Sözleşme için Sözleşme sütunundaki
          butona tıklayın.
        </p>
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <CustomDataTable
          data={data}
          columns={columns}
          storageKey="tenant-ayarlari"
          initialState={{
            columnVisibility: {
              logo_slug: false,
              homepage_mode: false,
              contact_email: false,
              contact_address: false,
            },
          }}
          filters={({ table, columnOrder, onColumnOrderChange }) => (
            <TenantSettingsToolbar
              table={table}
              columnOrder={columnOrder ?? []}
              onColumnOrderChange={onColumnOrderChange}
            />
          )}
          pageSizeOptions={[10, 20, 50]}
          tableSize="medium"
        />
      )}
      <TenantSettingsEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        row={editingRow}
        onSuccess={fetchData}
      />
      <AgreementEditDialog
        open={agreementOpen}
        onOpenChange={setAgreementOpen}
        row={agreementRow}
        onSuccess={fetchData}
      />
    </div>
  );
}
