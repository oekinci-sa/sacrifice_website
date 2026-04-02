"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useDeleteShareholder } from "@/hooks/useShareholders";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { AdminSacrificeHisseBedeliTableCell } from "@/lib/admin-sacrifice-hisse-bedeli";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { formatPhoneForDisplayWithSpacing, formatPhoneForInput } from "@/utils/formatters";
import { sortingFunctions } from "@/utils/table-sort-helpers";
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { formatDateMedium } from "@/lib/date-utils";
import { getOdemelerPaymentStatus } from "@/lib/odeme-payment-status";
import { AlertCircle, Check, CheckCircle2, Clock, Download, Loader2, Pencil, Phone, UserMinus, X } from "lucide-react";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { EditableSecondPhoneCell } from "@/app/(admin)/kurban-admin/components/editable-delivery-cells";
import {
  getDeliverySelectionFromLocation,
  getDeliveryTypeDisplayLabel,
} from "@/lib/delivery-options";
import { useCallback, useState } from "react";
import { EditableSacrificeNumberCell } from "./editable-sacrifice-number-cell";

type HissedarlarTableMeta = {
  openPdfForShareholder?: (sh: shareholderSchema) => void;
};

export function PdfColumnCell({
  row,
  table,
}: {
  row: Row<shareholderSchema>;
  table: Table<shareholderSchema>;
}) {
  const meta = table.options.meta as HissedarlarTableMeta | undefined;
  const onOpen = meta?.openPdfForShareholder;
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        aria-label="PDF indir"
        disabled={!onOpen}
        onClick={() => onOpen?.(row.original)}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PaymentStatusCell({ row }: { row: Row<shareholderSchema> }) {
  const branding = useTenantBranding();
  const paid = parseFloat(row.original.paid_amount.toString());
  const total = parseFloat(row.original.total_amount.toString());
  const remaining = parseFloat(row.original.remaining_payment.toString());
  const status = getOdemelerPaymentStatus(row.original, branding.deposit_amount);
  let StatusIcon: React.ElementType;
  let statusColorClass: string;
  let tooltipLabel: string;

  if (status === "deposit") {
    StatusIcon = AlertCircle;
    statusColorClass = "text-sac-red";
    tooltipLabel = "Kapora bekleniyor";
  } else if (status === "partial") {
    StatusIcon = Clock;
    statusColorClass = "text-sac-yellow";
    tooltipLabel = "Tüm ödeme bekleniyor";
  } else {
    StatusIcon = CheckCircle2;
    statusColorClass = "text-sac-primary";
    tooltipLabel = "Ödeme tamamlandı";
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + " TL";

  const isLiveScaleNoTotalYet =
    row.original.sacrifice?.pricing_mode === "live_scale" && total === 0;

  return (
    <div className="flex justify-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center p-1 cursor-default">
              <StatusIcon className={cn("h-4 w-4", statusColorClass)} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="p-4 w-[260px] bg-white shadow-lg border">
            <div className="space-y-3">
              <p className="font-semibold text-sm">{tooltipLabel}</p>
              <div className="grid gap-1.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0 bg-sac-primary" />
                    <span className="text-muted-foreground">Ödenen</span>
                  </div>
                  <span className="font-medium tabular-nums">{formatCurrency(paid)}</span>
                </div>
                {total > 0 && paid < total && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0 bg-sac-red" />
                      <span className="text-muted-foreground">Kalan</span>
                    </div>
                    <span className="font-medium tabular-nums">{formatCurrency(remaining)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground/50" />
                    <span className="text-muted-foreground">Toplam</span>
                  </div>
                  <span className="font-medium text-right max-w-[min(160px,50vw)]">
                    {isLiveScaleNoTotalYet ? "Henüz belli değil." : formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function ContactedButton({
  shareholderId,
  isContacted,
  shareholder,
}: {
  shareholderId: string;
  isContacted: boolean;
  shareholder: shareholderSchema;
}) {
  const [loading, setLoading] = useState(false);
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shareholders/${shareholderId}/contacted`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacted: !isContacted }),
      });
      if (res.ok) {
        const data = await res.json();
        updateShareholder({ ...data, sacrifice: shareholder.sacrifice });
        window.dispatchEvent(new Event("shareholders-updated"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isContacted
                ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                : "text-red-600 hover:text-red-700 hover:bg-red-50"
            )}
            onClick={handleClick}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isContacted ? "Görüşülmedi olarak işaretle" : "Görüşüldü olarak işaretle"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

async function updateShareholderField(
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

const EditableNameCell = ({ row }: { row: Row<shareholderSchema> }) => {
  const { toast } = useToast();
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(row.original.shareholder_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast({ title: "İsim boş olamaz", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "shareholder_name",
        trimmed
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

  const handleCancel = useCallback(() => { setIsEditing(false); setValue(row.original.shareholder_name || ""); }, [row.original.shareholder_name]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full justify-center">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
          className="h-8 text-sm flex-1 min-w-0"
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
      <span className="flex-1 text-center px-8 pr-9">{row.original.shareholder_name || "-"}</span>
      <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditing(true)}>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
};

const EditablePhoneCell = ({ row }: { row: Row<shareholderSchema> }) => {
  const { toast } = useToast();
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);
  const [isEditing, setIsEditing] = useState(false);
  const rawPhone = row.original.phone_number?.replace(/^\+90/, "0").replace(/\s/g, "") || "";
  const [value, setValue] = useState(() => formatPhoneForInput(rawPhone));
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10) {
      toast({ title: "Geçerli bir telefon girin", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "phone_number",
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
    setValue(formatPhoneForInput(row.original.phone_number?.replace(/^\+90/, "0") || ""));
  }, [row.original.phone_number]);

  const handleStartEdit = useCallback(() => {
    setValue(formatPhoneForInput(row.original.phone_number?.replace(/^\+90/, "0") || ""));
    setIsEditing(true);
  }, [row.original.phone_number]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full justify-center">
        <Input
          value={value}
          onChange={(e) => setValue(formatPhoneForInput(e.target.value))}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
          className="h-8 text-sm flex-1 min-w-0 tabular-nums"
          placeholder="0555 555 55 55"
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
      <span className="absolute inset-0 flex items-center justify-center tabular-nums px-8 whitespace-nowrap">{formatPhoneForDisplayWithSpacing(row.original.phone_number || "")}</span>
      <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleStartEdit}>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EditableEmailCell = ({ row }: { row: Row<shareholderSchema> }) => {
  const { toast } = useToast();
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(() => (row.original.email ?? "").trim());
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmed = value.trim();
    if (trimmed && !EMAIL_RE.test(trimmed)) {
      toast({ title: "Geçerli bir e-posta girin", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "email",
        trimmed ? trimmed : null
      );
      updateShareholder({ ...row.original, ...data, sacrifice: row.original.sacrifice });
      window.dispatchEvent(new Event("shareholders-updated"));
      toast({ title: "Güncellendi" });
      setIsEditing(false);
    } catch (e) {
      toast({
        title: "Hata",
        description: e instanceof Error ? e.message : "Güncelleme başarısız",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [value, row.original, updateShareholder, toast]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setValue((row.original.email ?? "").trim());
  }, [row.original.email]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full justify-center">
        <Input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="h-8 text-sm flex-1 min-w-0"
          placeholder="ornek@posta.com"
          autoFocus
          disabled={saving}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-50"
          onClick={handleSave}
          disabled={saving}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  const display = (row.original.email ?? "").trim() || "—";
  return (
    <div className="group relative w-full min-h-[2rem] flex items-center">
      <span
        className="flex-1 text-center text-sm px-8 truncate max-w-[220px] mx-auto"
        title={display !== "—" ? display : undefined}
      >
        {display}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
};

/** Teslimat tercihi/yeri düzenlemesi Teslimatlar sayfasında; burada salt okunur. */
const ReadOnlyDeliveryPreferenceCell = ({ row }: { row: Row<shareholderSchema> }) => {
  const branding = useTenantBranding();
  const deliveryType =
    row.original.delivery_type ??
    getDeliverySelectionFromLocation(branding.logo_slug, row.original.delivery_location || "");
  const label = getDeliveryTypeDisplayLabel(branding.logo_slug, deliveryType, null, false);
  return (
    <div className="flex min-h-[2rem] w-full items-center justify-center px-2">
      <span className="text-center text-sm">{label}</span>
    </div>
  );
};

const ReadOnlyDeliveryLocationCell = ({ row }: { row: Row<shareholderSchema> }) => {
  const loc = row.original.delivery_location;
  return (
    <div className="flex min-h-[2rem] w-full items-center justify-center px-2">
      <span className="text-center text-sm" title={loc || undefined}>
        {loc || "-"}
      </span>
    </div>
  );
};

const EditableConsentCell = ({ row }: { row: Row<shareholderSchema> }) => {
  const { toast } = useToast();
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);
  const [saving, setSaving] = useState(false);
  const consent = row.original.sacrifice_consent ?? false;

  const handleToggle = useCallback(async () => {
    setSaving(true);
    try {
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "sacrifice_consent",
        !consent
      );
      updateShareholder({ ...row.original, ...data, sacrifice: row.original.sacrifice });
      window.dispatchEvent(new Event("shareholders-updated"));
      toast({ title: "Güncellendi" });
    } catch (e) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Güncelleme başarısız", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [row.original, consent, updateShareholder, toast]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              consent ? "text-sac-primary hover:bg-sac-primary-lightest" : "text-sac-red hover:bg-sac-red-light"
            )}
            onClick={handleToggle}
            disabled={saving}
          >
            {consent ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {consent ? "Vekalet alınmadı olarak işaretle" : "Vekalet alındı olarak işaretle"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const EditableNotesCell = ({ row }: { row: Row<shareholderSchema> }) => {
  const { toast } = useToast();
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(row.original.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data } = await updateShareholderField(
        row.original.shareholder_id,
        "notes",
        value || null
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

  return (
    <>
      <div className="group relative w-full min-h-[2rem] flex min-w-0 items-center">
        <span className="flex-1 px-8 pr-9 text-left text-sm">
          {row.original.notes ? (
            <span>{row.original.notes}</span>
          ) : (
            <span className="text-muted-foreground">Not ekle</span>
          )}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => { setValue(row.original.notes || ""); setOpen(true); }}
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notlar</DialogTitle>
          </DialogHeader>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Not girin..."
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
};

// Create a separate component for the cell content
const ActionCellContent = ({ row }: { row: Row<shareholderSchema> }) => {
  const [isOpen, setIsOpen] = useState(false);
  const deleteMutation = useDeleteShareholder();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutate(row.original.shareholder_id);
      setIsOpen(false);
      toast({
        title: "Başarılı",
        description: "Hissedar başarıyla silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-end w-full">
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-sac-red hover:bg-sac-red-light"
                >
                  <span className="sr-only">Hissedarı sil</span>
                  <UserMinus className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Hissedarı sil</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu, veritabanınızdan bu hissedarı kalıcı olarak silecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const columns: ColumnDef<shareholderSchema>[] = [
  {
    id: "sacrifice_no",
    accessorFn: (row) => row.sacrifice?.sacrifice_no || "-",
    header: "Kur. Sır.",
    minSize: 70,
    enableSorting: true,
    sortingFn: sortingFunctions.number,
    cell: ({ row }) => <EditableSacrificeNumberCell row={row} />,
  },
  {
    accessorKey: "shareholder_name",
    header: "İsim Soyisim",
    minSize: 120,
    enableSorting: true,
    sortingFn: sortingFunctions.text,
    cell: ({ row }) => <EditableNameCell row={row} />,
    filterFn: (row, id, value: string) => {
      const rowValue = row.getValue(id);
      if (typeof rowValue !== "string") return false;
      const needle = normalizeTurkishSearchText(value);
      if (!needle) return true;
      return normalizeTurkishSearchText(rowValue).includes(needle);
    },
  },
  {
    accessorKey: "phone_number",
    header: "Telefon",
    minSize: 130,
    enableSorting: false,
    cell: ({ row }) => <EditablePhoneCell row={row} />,
  },
  {
    accessorKey: "email",
    header: "E-posta",
    minSize: 180,
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => <EditableEmailCell row={row} />,
  },
  {
    accessorKey: "second_phone_number",
    header: "İkinci Telefon",
    minSize: 130,
    enableSorting: false,
    cell: ({ row }) => <EditableSecondPhoneCell row={row} />,
  },
  {
    accessorKey: "contacted_at",
    header: "Görüşüldü",
    minSize: 90,
    enableSorting: true,
    sortingFn: (a, b) => {
      const aVal = a.original.contacted_at ?? "";
      const bVal = b.original.contacted_at ?? "";
      return aVal.localeCompare(bVal);
    },
    cell: ({ row }) => {
      const isContacted = !!row.original.contacted_at;
      return (
        <ContactedButton
          shareholderId={row.original.shareholder_id}
          isContacted={isContacted}
          shareholder={row.original}
        />
      );
    },
  },
  {
    id: "sacrifice_info",
    accessorFn: (row) => row.sacrifice?.share_weight ?? "-",
    header: "Hisse Bedeli",
    minSize: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <AdminSacrificeHisseBedeliTableCell sacrifice={row.original.sacrifice} />
    ),
  },
  {
    accessorKey: "delivery_location",
    header: "Teslimat Tercihi",
    minSize: 120,
    enableSorting: false,
    cell: ({ row }) => <ReadOnlyDeliveryPreferenceCell row={row} />,
  },
  {
    id: "delivery_location_raw",
    accessorFn: (row) => row.delivery_location ?? "",
    header: "Teslimat Yeri",
    minSize: 100,
    enableSorting: false,
    cell: ({ row }) => <ReadOnlyDeliveryLocationCell row={row} />,
  },
  {
    id: "payment_status",
    header: "Ödeme",
    minSize: 90,
    enableSorting: true,
    accessorFn: (row) => {
      const paid = parseFloat(row.paid_amount.toString());
      const total = parseFloat(row.total_amount.toString());
      return total > 0 ? (paid / total) * 100 : 0;
    },
    sortingFn: sortingFunctions.paymentPercentage,
    cell: ({ row }) => <PaymentStatusCell row={row} />,
  },
  {
    accessorKey: "purchase_time",
    header: "Kayıt Tarihi",
    minSize: 100,
    enableSorting: true,
    sortingFn: sortingFunctions.date,
    cell: ({ row }) => formatDateMedium(row.getValue("purchase_time")),
  },
  {
    accessorKey: "sacrifice_consent",
    header: "Vekalet",
    minSize: 90,
    enableSorting: false,
    cell: ({ row }) => <EditableConsentCell row={row} />,
  },
  {
    accessorKey: "notes",
    header: "Notlar",
    minSize: 100,
    meta: { align: "left" },
    enableSorting: false,
    cell: ({ row }) => <EditableNotesCell row={row} />,
  },
  {
    accessorKey: "last_edited_time",
    header: "Son Güncelleme",
    minSize: 110,
    enableSorting: true,
    sortingFn: sortingFunctions.date,
    cell: ({ row }) => formatDateMedium(row.getValue("last_edited_time")),
  },
  {
    accessorKey: "last_edited_by",
    header: "Son Güncelleyen",
    minSize: 110,
    enableSorting: true,
    cell: ({ row }) => {
      const sh = row.original;
      const label =
        sh.last_edited_by_display?.trim() ||
        sh.last_edited_by ||
        "";
      return label || "-";
    },
  },
  {
    id: "pdf",
    header: "PDF",
    minSize: 72,
    enableSorting: false,
    cell: ({ row, table }) => <PdfColumnCell row={row} table={table} />,
  },
  {
    id: "actions",
    header: "",
    minSize: 60,
    enableSorting: false,
    cell: ({ row }) => <ActionCellContent row={row} />,
  },
];