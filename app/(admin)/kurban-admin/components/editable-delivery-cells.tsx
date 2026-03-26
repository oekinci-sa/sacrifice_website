"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { shareholderSchema } from "@/types";
import {
  formatDeliveryOptionLabel,
  getDeliveryDisplayLabel,
  getDeliveryLocationFromSelection,
  getDeliveryOptions,
  getDeliverySelectionFromLocation,
  getDeliveryTypeDisplayLabel,
} from "@/lib/delivery-options";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { formatPhoneForDisplayWithSpacing, formatPhoneForInput } from "@/utils/formatters";
import { Row } from "@tanstack/react-table";
import { Check, Pencil, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export async function updateShareholderField(
  shareholderId: string,
  field: string,
  value: string | boolean | null,
  extraFields?: Record<string, string | boolean | null>
) {
  const body: Record<string, unknown> = {
    shareholder_id: shareholderId,
    [field]: value,
    ...extraFields,
  };
  const res = await fetch("/api/update-shareholder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Güncelleme başarısız");
  }
  return res.json();
}

export function EditableDeliveryCell({ row }: { row: Row<shareholderSchema> }) {
  const { toast } = useToast();
  const branding = useTenantBranding();
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [secondPhoneDialogOpen, setSecondPhoneDialogOpen] = useState(false);
  const [secondPhoneValue, setSecondPhoneValue] = useState("");
  const [secondPhoneError, setSecondPhoneError] = useState<string | null>(null);

  const deliveryOptions = useMemo(() => {
    const isElya = branding.logo_slug === "elya-hayvancilik";
    const current = row.original.delivery_location;

    if (isElya) {
      const adreseValue = current && current !== "Gölbaşı" ? current : "-";
      const elyaOpts = getDeliveryOptions("elya-hayvancilik");
      return [
        { label: formatDeliveryOptionLabel(elyaOpts[0]), value: "Gölbaşı" },
        { label: formatDeliveryOptionLabel(elyaOpts[1]), value: adreseValue },
      ];
    }

    const opts = getDeliveryOptions(branding.logo_slug).map((opt) => ({
      label: formatDeliveryOptionLabel(opt),
      value: getDeliveryLocationFromSelection(branding.logo_slug, opt.value),
    }));
    if (current && !opts.some((o) => o.value === current)) {
      opts.push({ label: getDeliveryDisplayLabel(branding.logo_slug, current), value: current });
    }
    return opts;
  }, [branding.logo_slug, row.original.delivery_location]);

  const deliveryType =
    row.original.delivery_type ??
    getDeliverySelectionFromLocation(branding.logo_slug, row.original.delivery_location || "");
  const current = getDeliveryTypeDisplayLabel(
    branding.logo_slug,
    deliveryType,
    null,
    false
  );

  const handleConfirm = useCallback(async () => {
    if (!pendingValue) return;
    setSaving(true);
    try {
      const delivery_type = getDeliverySelectionFromLocation(branding.logo_slug, pendingValue);
      const extraFields: Record<string, string | null> = { delivery_type };
      if (delivery_type !== "Adrese teslim") {
        extraFields.second_phone_number = null;
      }
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "delivery_location",
        pendingValue,
        extraFields
      );
      updateShareholder({ ...row.original, ...data, sacrifice: row.original.sacrifice });
      window.dispatchEvent(new Event("shareholders-updated"));
      toast({ title: "Güncellendi" });
      setIsEditing(false);
      setPendingValue(null);
    } catch (e) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Güncelleme başarısız", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [pendingValue, row.original, updateShareholder, toast, branding.logo_slug]);

  const handleSecondPhoneConfirm = useCallback(async () => {
    const digitsSecond = secondPhoneValue.replace(/\D/g, "");
    const digitsPhone = (row.original.phone_number ?? "").replace(/\D/g, "");
    setSecondPhoneError(null);
    if (!secondPhoneValue.trim()) {
      setSecondPhoneError("İkinci telefon numarası zorunludur");
      return;
    }
    if (digitsSecond.length !== 11 || !secondPhoneValue.startsWith("05")) {
      setSecondPhoneError("Geçerli bir telefon numarası giriniz (05XX XXX XX XX)");
      return;
    }
    if (digitsPhone && digitsSecond === digitsPhone) {
      setSecondPhoneError("İkinci telefon numarası birinciden farklı olmalıdır");
      return;
    }
    setSaving(true);
    try {
      const delivery_type = getDeliverySelectionFromLocation(branding.logo_slug, pendingValue ?? "");
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "delivery_location",
        pendingValue ?? "",
        { delivery_type, second_phone_number: secondPhoneValue }
      );
      updateShareholder({ ...row.original, ...data, sacrifice: row.original.sacrifice });
      window.dispatchEvent(new Event("shareholders-updated"));
      toast({ title: "Güncellendi" });
      setSecondPhoneDialogOpen(false);
      setSecondPhoneValue("");
      setSecondPhoneError(null);
      setIsEditing(false);
      setPendingValue(null);
    } catch (e) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Güncelleme başarısız", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [secondPhoneValue, pendingValue, row.original, updateShareholder, toast, branding.logo_slug]);

  const handleSecondPhoneCancel = useCallback(() => {
    setSecondPhoneDialogOpen(false);
    setSecondPhoneValue("");
    setSecondPhoneError(null);
    setIsEditing(false);
    setPendingValue(null);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setPendingValue(null);
  }, []);

  const handleOptionSelect = useCallback((optValue: string) => {
    const selectedType = getDeliverySelectionFromLocation(branding.logo_slug, optValue);
    const needsSecondPhone = selectedType === "Adrese teslim" && deliveryType !== "Adrese teslim";
    setPendingValue(optValue);
    setIsEditing(true);
    if (needsSecondPhone) {
      setSecondPhoneValue("");
      setSecondPhoneError(null);
      setSecondPhoneDialogOpen(true);
    }
  }, [branding.logo_slug, deliveryType]);

  if (isEditing && pendingValue !== null && !secondPhoneDialogOpen) {
    const pendingType = getDeliverySelectionFromLocation(branding.logo_slug, pendingValue);
    return (
      <div className="flex items-center gap-1 w-full justify-center">
        <span className="flex-1 text-center text-sm min-w-0">{getDeliveryTypeDisplayLabel(branding.logo_slug, pendingType, null, false)}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-50" onClick={handleConfirm} disabled={saving}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={handleCancel} disabled={saving}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="group relative w-full min-h-[2rem] flex items-center">
        <span className="flex-1 text-center text-sm px-8 pr-9 py-1">{current}</span>
        <DropdownMenu open={dropdownOpen} onOpenChange={(open) => { setDropdownOpen(open); if (!open && isEditing && !pendingValue) setIsEditing(false); }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {deliveryOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleOptionSelect(opt.value)}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={secondPhoneDialogOpen} onOpenChange={(open) => { if (!open) handleSecondPhoneCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>İkinci Telefon Numarası (Adrese Teslim)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Mevcut telefon</Label>
              <p className="text-sm font-medium tabular-nums">
                {formatPhoneForDisplayWithSpacing(row.original.phone_number ?? "")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="second-phone-input">İkinci telefon (teslimat için)</Label>
              <Input
                id="second-phone-input"
                placeholder="05XX XXX XX XX"
                value={secondPhoneValue}
                onChange={(e) => setSecondPhoneValue(formatPhoneForInput(e.target.value))}
                className={secondPhoneError ? "border-destructive" : ""}
              />
              {secondPhoneError && (
                <p className="text-sm text-destructive">{secondPhoneError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleSecondPhoneCancel} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSecondPhoneConfirm} disabled={saving}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditableSecondPhoneCell({ row }: { row: Row<shareholderSchema> }) {
  const { toast } = useToast();
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);
  const [isEditing, setIsEditing] = useState(false);
  const rawPhone = row.original.second_phone_number?.replace(/^\+90/, "0").replace(/\s/g, "") || "";
  const [value, setValue] = useState(() => formatPhoneForInput(rawPhone));
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSaving(true);
      try {
        const { data } = await updateShareholderField(
          row.original.shareholder_id,
          "second_phone_number",
          null
        );
        updateShareholder({ ...row.original, ...data, sacrifice: row.original.sacrifice });
        window.dispatchEvent(new Event("shareholders-updated"));
        toast({ title: "Güncellendi" });
        setIsEditing(false);
      } catch (e) {
        toast({ title: "Hata", description: e instanceof Error ? e.message : "Güncelleme başarısız", variant: "destructive" });
      } finally {
        setSaving(false);
      }
      return;
    }
    const digits = trimmed.replace(/\D/g, "");
    const phoneDigits = (row.original.phone_number ?? "").replace(/\D/g, "");
    if (digits.length < 10) {
      toast({ title: "Geçerli bir telefon girin", variant: "destructive" });
      return;
    }
    if (phoneDigits && digits === phoneDigits) {
      toast({ title: "İkinci telefon birinciden farklı olmalıdır", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "second_phone_number",
        value
      );
      updateShareholder({ ...row.original, ...data, sacrifice: row.original.sacrifice });
      window.dispatchEvent(new Event("shareholders-updated"));
      toast({ title: "Güncellendi" });
      setIsEditing(false);
    } catch (e) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Güncelleme başarısız", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [value, row.original, updateShareholder, toast]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setValue(formatPhoneForInput(row.original.second_phone_number?.replace(/^\+90/, "0") || ""));
  }, [row.original.second_phone_number]);

  const handleStartEdit = useCallback(() => {
    setValue(formatPhoneForInput(row.original.second_phone_number?.replace(/^\+90/, "0") || ""));
    setIsEditing(true);
  }, [row.original.second_phone_number]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full justify-center">
        <Input
          value={value}
          onChange={(e) => setValue(formatPhoneForInput(e.target.value))}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
          className="h-8 text-sm flex-1 min-w-0 tabular-nums"
          placeholder="05XX XXX XX XX"
          autoFocus
          disabled={saving}
        />
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-50" onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={handleCancel} disabled={saving}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  return (
    <div className="group relative w-full min-h-[2rem] flex items-center">
      <span className="absolute inset-0 flex items-center justify-center tabular-nums px-8 whitespace-nowrap">
        {formatPhoneForDisplayWithSpacing(row.original.second_phone_number || "") || "-"}
      </span>
      <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleStartEdit}>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}

export function EditableDeliveryLocationCell({ row }: { row: Row<shareholderSchema> }) {
  const { toast } = useToast();
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(row.original.delivery_location || "");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "delivery_location",
        value.trim() || row.original.delivery_location || ""
      );
      updateShareholder({ ...row.original, ...data, sacrifice: row.original.sacrifice });
      window.dispatchEvent(new Event("shareholders-updated"));
      toast({ title: "Güncellendi" });
      setOpen(false);
    } catch (e) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Güncelleme başarısız", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [value, row.original, updateShareholder, toast]);

  const loc = row.original.delivery_location;

  return (
    <>
      <div className="group relative w-full min-h-[2rem] flex items-center min-w-0">
        <span className="flex-1 text-left px-8 pr-9 py-1 text-sm">
          {loc || "-"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => { setValue(loc || ""); setOpen(true); }}
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Teslimat Yeri</DialogTitle>
          </DialogHeader>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Teslimat yeri veya adres..."
          />
          <DialogFooter className="gap-2">
            <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="icon" className="h-9 w-9 bg-white border border-sac-primary text-sac-primary hover:bg-sac-primary-lightest" onClick={handleSave} disabled={saving}>
              <Check className="h-4 w-4 text-sac-primary" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
