"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrencyForInput, formatPhoneForInput, parseCurrencyFromInput } from "@/utils/formatters";
import { Row } from "@tanstack/react-table";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { TenantSettingRow } from "./columns";

async function patchTenantSetting(
  tenantId: string,
  field: string,
  value: string | number | null
) {
  const res = await fetch(`/api/admin/tenant-settings/${tenantId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: value }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Güncelleme başarısız");
  }
}

/** Ortak pattern: display + pencil icon (hover), edit modunda input + tick + x */
function EditableCellWrapper({
  display,
  onEdit,
  children,
  className = "",
}: {
  display: React.ReactNode;
  onEdit: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  if (children) return <>{children}</>;
  return (
    <div className={`group relative w-full min-h-[2rem] flex items-center ${className}`}>
      <span className="flex-1 truncate pr-8">{display}</span>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onEdit}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="sr-only">Düzenle</span>
      </Button>
    </div>
  );
}

interface EditInputWithActionsProps {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  children: React.ReactNode;
  minWidth?: string;
}

function EditInputWithActions({
  onSave,
  onCancel,
  saving,
  children,
  minWidth = "min-w-[80px]",
}: EditInputWithActionsProps) {
  return (
    <div className={`flex items-center gap-1 ${minWidth}`}>
      {children}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0"
        onClick={onSave}
        disabled={saving}
      >
        <Check className="h-4 w-4" />
        <span className="sr-only">Kaydet</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
        onClick={onCancel}
        disabled={saving}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">İptal</span>
      </Button>
      {saving && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
    </div>
  );
}

export function EditableYearCell({
  row,
  onSuccess,
}: {
  row: Row<TenantSettingRow>;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(String(row.original.active_sacrifice_year ?? ""));

  const save = useCallback(async () => {
    const num = value ? parseInt(value, 10) : null;
    if (num === (row.original.active_sacrifice_year ?? null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await patchTenantSetting(row.original.tenant_id, "active_sacrifice_year", num);
      toast({ title: "Başarılı", description: "Yıl güncellendi." });
      onSuccess();
      setEditing(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err instanceof Error ? err.message : "Güncelleme başarısız",
      });
    } finally {
      setSaving(false);
    }
  }, [row, value, onSuccess, toast]);

  const cancel = useCallback(() => {
    setValue(String(row.original.active_sacrifice_year ?? ""));
    setEditing(false);
  }, [row.original.active_sacrifice_year]);

  const startEdit = useCallback(() => {
    setValue(String(row.original.active_sacrifice_year ?? ""));
    setEditing(true);
  }, [row.original.active_sacrifice_year]);

  if (editing) {
    return (
      <EditInputWithActions
        onSave={save}
        onCancel={cancel}
        saving={saving}
        minWidth="min-w-[100px]"
      >
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="h-8 text-sm"
          autoFocus
        />
      </EditInputWithActions>
    );
  }

  const display = row.original.active_sacrifice_year ?? "-";
  return (
    <EditableCellWrapper display={display} onEdit={startEdit} />
  );
}

export function EditableDepositCell({
  row,
  onSuccess,
}: {
  row: Row<TenantSettingRow>;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const v = row.original.deposit_amount;
  const [value, setValue] = useState(v != null ? formatCurrencyForInput(v.toString()) : "");

  const save = useCallback(async () => {
    const num = parseCurrencyFromInput(value);
    if (num === (row.original.deposit_amount ?? null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await patchTenantSetting(row.original.tenant_id, "deposit_amount", num);
      toast({ title: "Başarılı", description: "Kapora güncellendi." });
      onSuccess();
      setEditing(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err instanceof Error ? err.message : "Güncelleme başarısız",
      });
    } finally {
      setSaving(false);
    }
  }, [row, value, onSuccess, toast]);

  const cancel = useCallback(() => {
    const v = row.original.deposit_amount;
    setValue(v != null ? formatCurrencyForInput(v.toString()) : "");
    setEditing(false);
  }, [row.original.deposit_amount]);

  const startEdit = useCallback(() => {
    const v = row.original.deposit_amount;
    setValue(v != null ? formatCurrencyForInput(v.toString()) : "");
    setEditing(true);
  }, [row.original.deposit_amount]);

  if (editing) {
    return (
      <EditInputWithActions
        onSave={save}
        onCancel={cancel}
        saving={saving}
        minWidth="min-w-[120px]"
      >
        <Input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(formatCurrencyForInput(e.target.value))}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="h-8 text-sm tabular-nums"
          autoFocus
        />
      </EditInputWithActions>
    );
  }

  const display = v != null ? v.toLocaleString("tr-TR") : "-";
  return (
    <EditableCellWrapper display={display} onEdit={startEdit} />
  );
}

export function EditablePhoneCell({
  row,
  onSuccess,
}: {
  row: Row<TenantSettingRow>;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const raw = (row.original.contact_phone ?? "").replace(/\s/g, "");
  const [value, setValue] = useState(raw ? formatPhoneForInput(raw.startsWith("0") ? raw : "0" + raw) : "");

  const save = useCallback(async () => {
    const v = value.trim() || null;
    if (v === (row.original.contact_phone ?? null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await patchTenantSetting(row.original.tenant_id, "contact_phone", v);
      toast({ title: "Başarılı", description: "Telefon güncellendi." });
      onSuccess();
      setEditing(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err instanceof Error ? err.message : "Güncelleme başarısız",
      });
    } finally {
      setSaving(false);
    }
  }, [row, value, onSuccess, toast]);

  const cancel = useCallback(() => {
    const raw = (row.original.contact_phone ?? "").replace(/\s/g, "");
    setValue(raw ? formatPhoneForInput(raw.startsWith("0") ? raw : "0" + raw) : "");
    setEditing(false);
  }, [row.original.contact_phone]);

  const startEdit = useCallback(() => {
    const raw = (row.original.contact_phone ?? "").replace(/\s/g, "");
    setValue(raw ? formatPhoneForInput(raw.startsWith("0") ? raw : "0" + raw) : "");
    setEditing(true);
  }, [row.original.contact_phone]);

  if (editing) {
    return (
      <EditInputWithActions
        onSave={save}
        onCancel={cancel}
        saving={saving}
        minWidth="min-w-[160px]"
      >
        <Input
          value={value}
          onChange={(e) => setValue(formatPhoneForInput(e.target.value))}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="h-8 text-sm tabular-nums"
          autoFocus
        />
      </EditInputWithActions>
    );
  }

  const display = row.original.contact_phone ?? "-";
  return (
    <EditableCellWrapper display={display} onEdit={startEdit} className="min-w-[100px]" />
  );
}

const HOMEPAGE_MODE_OPTIONS = [
  { value: "bana_haber_ver", label: "Ön Bilgilendirme / Bana Haber Ver" },
  { value: "geri_sayim", label: "Yakında Açılıyor (geri sayım)" },
  { value: "live", label: "Satış Aktif" },
  { value: "tesekkur", label: "Teşekkür" },
  { value: "follow_up", label: "Takip / Kesim" },
] as const;

export function EditableHomepageModeCell({
  row,
  onSuccess,
}: {
  row: Row<TenantSettingRow>;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(row.original.homepage_mode ?? "bana_haber_ver");

  const save = useCallback(async () => {
    if (value === (row.original.homepage_mode ?? null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await patchTenantSetting(row.original.tenant_id, "homepage_mode", value);
      toast({ title: "Başarılı", description: "Anasayfa modu güncellendi." });
      onSuccess();
      setEditing(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err instanceof Error ? err.message : "Güncelleme başarısız",
      });
    } finally {
      setSaving(false);
    }
  }, [row, value, onSuccess, toast]);

  const cancel = useCallback(() => {
    setValue(row.original.homepage_mode ?? "bana_haber_ver");
    setEditing(false);
  }, [row.original.homepage_mode]);

  const current = row.original.homepage_mode ?? "bana_haber_ver";
  const display = HOMEPAGE_MODE_OPTIONS.find((o) => o.value === current)?.label ?? current;

  if (editing) {
    return (
      <EditInputWithActions
        onSave={save}
        onCancel={cancel}
        saving={saving}
        minWidth="min-w-[140px]"
      >
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOMEPAGE_MODE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </EditInputWithActions>
    );
  }

  return (
    <EditableCellWrapper display={display} onEdit={() => { setValue(current); setEditing(true); }} />
  );
}

/** Genel metin hücresi - logo, iban, website, email, address, sayılar vb. */
export function EditableTextCell({
  row,
  field,
  onSuccess,
  display,
  placeholder = "",
}: {
  row: Row<TenantSettingRow>;
  field: keyof TenantSettingRow;
  onSuccess: () => void;
  display?: (value: string | null) => string;
  placeholder?: string;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const raw = (row.original[field] as string | number | null) ?? "";
  const strVal = typeof raw === "number" ? String(raw) : String(raw);
  const [value, setValue] = useState(strVal);

  const numericFields = ["deposit_deadline_days", "full_payment_deadline_month", "full_payment_deadline_day"];
  const isNumeric = numericFields.includes(field as string);

  const save = useCallback(async () => {
    const current = row.original[field] as string | number | null;
    let newVal: string | number | null;
    if (isNumeric) {
      const num = value.trim() ? parseInt(value, 10) : null;
      if (num === (current ?? null)) {
        setEditing(false);
        return;
      }
      newVal = num;
    } else {
      newVal = value.trim() || null;
      const currentStr = current == null ? null : String(current);
      if (newVal === currentStr) {
        setEditing(false);
        return;
      }
    }
    setSaving(true);
    try {
      await patchTenantSetting(row.original.tenant_id, field as string, newVal);
      toast({ title: "Başarılı", description: "Güncellendi." });
      onSuccess();
      setEditing(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err instanceof Error ? err.message : "Güncelleme başarısız",
      });
    } finally {
      setSaving(false);
    }
  }, [row, field, value, onSuccess, toast, isNumeric]);

  const cancel = useCallback(() => {
    const raw = (row.original[field] as string | number | null) ?? "";
    setValue(typeof raw === "number" ? String(raw) : String(raw));
    setEditing(false);
  }, [row.original, field]);

  const startEdit = useCallback(() => {
    const raw = (row.original[field] as string | number | null) ?? "";
    setValue(typeof raw === "number" ? String(raw) : String(raw));
    setEditing(true);
  }, [row.original, field]);

  const displayVal = display
    ? display((row.original[field] as string | null) ?? null)
    : strVal || "-";

  if (editing) {
    return (
      <EditInputWithActions
        onSave={save}
        onCancel={cancel}
        saving={saving}
        minWidth="min-w-[100px]"
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="h-8 text-sm"
          placeholder={placeholder}
          autoFocus
        />
      </EditInputWithActions>
    );
  }

  return (
    <EditableCellWrapper display={displayVal} onEdit={startEdit} />
  );
}
