"use client";

import { ColumnSelectorPopover } from "@/app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/column-selector-popover";
import { Table } from "@tanstack/react-table";
import type { TenantSettingRow } from "./columns";

export const TENANT_COLUMN_HEADER_MAP: Record<string, string> = {
  tenants: "Tenant",
  logo_slug: "Logo",
  homepage_mode: "Anasayfa Modu",
  homepage_layout: "Anasayfa Düzeni",
  active_sacrifice_year: "Yıl",
  deposit_amount: "Kapora (₺)",
  deposit_deadline_days: "Kapora Gün",
  full_payment_deadline_month: "Tam Ödeme Ay",
  full_payment_deadline_day: "Tam Ödeme Gün",
  iban: "IBAN",
  website_url: "Website",
  contact_phone: "Telefon",
  contact_email: "E-posta",
  contact_address: "Adres",
  agreement_terms: "Sözleşme",
};

interface TenantSettingsToolbarProps {
  table: Table<TenantSettingRow>;
  columnOrder: string[];
  onColumnOrderChange?: (order: string[]) => void;
}

export function TenantSettingsToolbar({
  table,
  columnOrder,
  onColumnOrderChange,
}: TenantSettingsToolbarProps) {
  return (
    <div className="flex items-center justify-end w-full">
      <ColumnSelectorPopover
        table={table}
        columnHeaderMap={TENANT_COLUMN_HEADER_MAP}
        columnOrder={columnOrder}
        onColumnOrderChange={onColumnOrderChange}
      />
    </div>
  );
}
