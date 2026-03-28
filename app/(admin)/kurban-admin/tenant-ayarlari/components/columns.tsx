"use client";

import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { FileText, Pencil } from "lucide-react";
import { formatIbanForDisplay } from "@/utils/formatters";
import {
  EditableDepositCell,
  EditableHomepageModeCell,
  EditablePhoneCell,
  EditableTextCell,
  EditableYearCell,
} from "./editable-tenant-cells";

export type AgreementTerm = { title: string; description: string };

export type TenantSettingRow = {
  tenant_id: string;
  theme_json: Record<string, unknown> | null;
  homepage_mode: string | null;
  logo_slug: string | null;
  iban: string | null;
  iban_account_holder: string | null;
  website_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  active_sacrifice_year: number | null;
  deposit_amount: number | null;
  deposit_deadline_days: number | null;
  full_payment_deadline_month: number | null;
  full_payment_deadline_day: number | null;
  agreement_terms: AgreementTerm[] | null;
  agreement_dialog_title: string | null;
  agreement_main_heading: string | null;
  agreement_intro_text: string | null;
  agreement_footer_text: string | null;
  agreement_notice_after_term_title: string | null;
  agreement_notice_after_term_body: string | null;
  tenants?: { name?: string; slug?: string } | null;
};

export function createColumns(
  onEdit: (row: TenantSettingRow) => void,
  onEditAgreement: (row: TenantSettingRow) => void,
  onRefresh: () => void
): ColumnDef<TenantSettingRow>[] {
  return [
    {
      accessorKey: "tenants",
      id: "tenants",
      header: "Organizasyon",
      cell: ({ row }) => {
        const t = row.original.tenants;
        const name =
          t && typeof t === "object" && "name" in t ? String(t.name ?? "-") : "-";
        return <span className="font-medium">{name}</span>;
      },
    },
    {
      accessorKey: "logo_slug",
      id: "logo_slug",
      header: "Logo",
      cell: ({ row }) => (
        <EditableTextCell row={row} field="logo_slug" onSuccess={onRefresh} />
      ),
    },
    {
      accessorKey: "homepage_mode",
      id: "homepage_mode",
      header: "Anasayfa Modu",
      cell: ({ row }) => (
        <EditableHomepageModeCell row={row} onSuccess={onRefresh} />
      ),
    },
    {
      accessorKey: "active_sacrifice_year",
      id: "active_sacrifice_year",
      header: "Yıl",
      cell: ({ row }) => <EditableYearCell row={row} onSuccess={onRefresh} />,
    },
    {
      accessorKey: "deposit_amount",
      id: "deposit_amount",
      header: "Kapora (₺)",
      cell: ({ row }) => <EditableDepositCell row={row} onSuccess={onRefresh} />,
    },
    {
      accessorKey: "deposit_deadline_days",
      id: "deposit_deadline_days",
      header: "Kapora Gün",
      cell: ({ row }) => (
        <EditableTextCell row={row} field="deposit_deadline_days" onSuccess={onRefresh} />
      ),
    },
    {
      accessorKey: "full_payment_deadline_month",
      id: "full_payment_deadline_month",
      header: "Tam Ödeme Ay",
      cell: ({ row }) => (
        <EditableTextCell row={row} field="full_payment_deadline_month" onSuccess={onRefresh} />
      ),
    },
    {
      accessorKey: "full_payment_deadline_day",
      id: "full_payment_deadline_day",
      header: "Tam Ödeme Gün",
      cell: ({ row }) => (
        <EditableTextCell row={row} field="full_payment_deadline_day" onSuccess={onRefresh} />
      ),
    },
    {
      accessorKey: "iban",
      id: "iban",
      header: "IBAN",
      cell: ({ row }) => (
        <EditableTextCell
          row={row}
          field="iban"
          onSuccess={onRefresh}
          display={(v) => {
            if (!v) return "-";
            const f = formatIbanForDisplay(String(v));
            return f.length > 44 ? `${f.slice(0, 41)}…` : f;
          }}
        />
      ),
    },
    {
      accessorKey: "website_url",
      id: "website_url",
      header: "Website",
      cell: ({ row }) => (
        <EditableTextCell row={row} field="website_url" onSuccess={onRefresh} />
      ),
    },
    {
      accessorKey: "contact_phone",
      id: "contact_phone",
      header: "Telefon",
      cell: ({ row }) => <EditablePhoneCell row={row} onSuccess={onRefresh} />,
    },
    {
      accessorKey: "contact_email",
      id: "contact_email",
      header: "E-posta",
      cell: ({ row }) => (
        <EditableTextCell row={row} field="contact_email" onSuccess={onRefresh} />
      ),
    },
    {
      accessorKey: "contact_address",
      id: "contact_address",
      header: "Adres",
      cell: ({ row }) => (
        <EditableTextCell
          row={row}
          field="contact_address"
          onSuccess={onRefresh}
          display={(v) => (v && v.length > 25 ? v.slice(0, 22) + "…" : v || "-")}
        />
      ),
    },
    {
      accessorKey: "agreement_terms",
      id: "agreement_terms",
      header: "Sözleşme",
      cell: ({ row }) => {
        const terms = row.original.agreement_terms;
        const count = Array.isArray(terms) ? terms.length : 0;
        return (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{count > 0 ? `${count} madde` : "-"}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEditAgreement(row.original)}
            >
              <FileText className="h-4 w-4" />
              <span className="sr-only">Sözleşmeyi düzenle</span>
            </Button>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(row.original)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Düzenle</span>
        </Button>
      ),
    },
  ];
}
