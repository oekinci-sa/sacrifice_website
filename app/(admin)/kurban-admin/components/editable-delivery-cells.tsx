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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  getDeliveryDisplayLabel,
  getDeliveryLocationFromSelection,
  getDeliveryOptions,
  getDeliverySelectionFromLocation,
  getDeliveryTypeDisplayLabel,
} from "@/lib/delivery-options";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { Row } from "@tanstack/react-table";
import { Check, Pencil, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";

export async function updateShareholderField(
  shareholderId: string,
  field: string,
  value: string | boolean | null,
  lastEditedBy: string,
  extraFields?: Record<string, string | boolean | null>
) {
  const body: Record<string, unknown> = {
    shareholder_id: shareholderId,
    last_edited_by: lastEditedBy,
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
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const deliveryOptions = useMemo(() => {
    const isElya = branding.logo_slug === "elya-hayvancilik";
    const current = row.original.delivery_location;

    if (isElya) {
      // Elya: sadece Kesimhane ve Adrese Teslim - ücret/adres metni yok
      const adreseValue = current && current !== "Gölbaşı" ? current : "-";
      return [
        { label: "Kesimhane", value: "Gölbaşı" },
        { label: "Adrese Teslim", value: adreseValue },
      ];
    }

    const opts = getDeliveryOptions(branding.logo_slug).map((opt) => ({
      label: opt.label,
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
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "delivery_location",
        pendingValue,
        session?.user?.name ?? "Sistem",
        { delivery_type }
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
  }, [pendingValue, row.original, session?.user?.name, updateShareholder, toast, branding.logo_slug]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setPendingValue(null);
  }, []);

  if (isEditing && pendingValue !== null) {
    const pendingType = getDeliverySelectionFromLocation(branding.logo_slug, pendingValue);
    return (
      <div className="flex items-center gap-1 w-full justify-center">
        <span className="flex-1 text-center text-sm min-w-0 truncate">{getDeliveryTypeDisplayLabel(branding.logo_slug, pendingType, null, false)}</span>
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
    <div className="group relative w-full min-h-[2rem] flex items-center">
      <span className="absolute inset-0 flex items-center justify-center text-sm truncate px-8 py-1">{current}</span>
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
              onClick={() => { setPendingValue(opt.value); setIsEditing(true); }}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function EditableDeliveryLocationCell({ row }: { row: Row<shareholderSchema> }) {
  const { toast } = useToast();
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(row.original.delivery_location || "");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "delivery_location",
        value.trim() || row.original.delivery_location || "",
        session?.user?.name ?? "Sistem"
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
  }, [value, row.original, session?.user?.name, updateShareholder, toast]);

  const loc = row.original.delivery_location;

  return (
    <>
      <div className="group relative w-full min-h-[2rem] flex items-center min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute inset-0 flex items-start justify-start truncate px-8 py-1 text-sm text-left cursor-default">
                {loc || "-"}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[320px] break-words">
              {loc || "-"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
