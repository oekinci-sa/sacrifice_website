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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { triggerSacrificeRefresh } from "@/utils/data-refresh";
import { sacrificeSchema } from "@/types";
import { Row } from "@tanstack/react-table";
import { Check, Pencil, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { getDefaultPriceInfoByTenant } from "@/lib/price-info-by-tenant";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";

type PriceOption = { kg: string; price: string } | { kg: number; price: number };

async function updateSacrificeApi(
  sacrificeId: string,
  sacrificeYear: number | undefined,
  payload: Partial<{ share_weight: number; share_price: number; empty_share: number; notes: string }>,
  lastEditedBy: string
) {
  const body: Record<string, unknown> = {
    sacrifice_id: sacrificeId,
    ...payload,
    last_edited_by: lastEditedBy,
    last_edited_time: new Date().toISOString(),
  };
  if (sacrificeYear != null) body.sacrifice_year = sacrificeYear;
  const res = await fetch("/api/update-sacrifice", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Güncelleme başarısız");
  }
  return res.json();
}

function formatPriceOption(opt: PriceOption): string {
  const kg = typeof opt.kg === "string" ? opt.kg : `${opt.kg} kg`;
  const price = typeof opt.price === "number"
    ? new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(opt.price)
    : opt.price;
  return `${kg} - ${price} TL`;
}

export function EditableSharePriceCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
  const { data: session } = useSession();
  const branding = useTenantBranding();
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [options, setOptions] = useState<PriceOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingOpt, setPendingOpt] = useState<PriceOption | null>(null);

  const sacrifice = row.original;
  const displayText = sacrifice.share_weight != null && sacrifice.share_price != null
    ? `${sacrifice.share_weight} kg. - ${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(sacrifice.share_price)} TL`
    : "-";

  const getKg = (o: PriceOption) => typeof o.kg === "number" ? o.kg : parseFloat(String(o.kg).replace(/[^\d.]/g, ""));
  const getPrice = (o: PriceOption) => typeof o.price === "number" ? o.price : parseInt(String(o.price).replace(/\./g, ""), 10);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const url = selectedYear != null ? `/api/price-info?year=${selectedYear}` : "/api/price-info";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.map((d: { kg: number; price: number }) => ({ kg: d.kg, price: d.price }));
          }
        }
      } catch {}
      return getDefaultPriceInfoByTenant(branding.logo_slug).map((p) => ({
        kg: parseFloat(p.kg.replace(/[^\d.]/g, "")),
        price: parseInt(p.price.replace(/\./g, ""), 10),
      }));
    };
    load().then((opts) => {
      if (!cancelled) setOptions(opts);
    });
    return () => { cancelled = true; };
  }, [branding.logo_slug, selectedYear]);

  const handleConfirm = useCallback(
    async () => {
      if (!pendingOpt) return;
      const kg = getKg(pendingOpt);
      const price = getPrice(pendingOpt);
      setSaving(true);
      try {
        const { data } = await updateSacrificeApi(
          sacrifice.sacrifice_id,
          sacrifice.sacrifice_year,
          { share_weight: kg, share_price: price },
          session?.user?.email ?? "Sistem"
        );
        updateSacrifice({ ...sacrifice, ...data });
        triggerSacrificeRefresh();
        toast({ title: "Güncellendi" });
        setPendingOpt(null);
        setOpen(false);
      } catch (e) {
        toast({ title: "Hata", description: e instanceof Error ? e.message : "Güncelleme başarısız", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [pendingOpt, sacrifice, session?.user?.email, updateSacrifice, toast]
  );

  const handleCancel = useCallback(() => {
    setPendingOpt(null);
    setOpen(false);
  }, []);

  const currentInOptions = options.some(
    (o) => Math.abs(getKg(o) - (sacrifice.share_weight ?? 0)) < 0.01
  );
  const allOptions = currentInOptions
    ? options
    : [...options, { kg: sacrifice.share_weight ?? 0, price: sacrifice.share_price ?? 0 }].sort(
        (a, b) => getPrice(a) - getPrice(b)
      );

  if (pendingOpt !== null) {
    return (
      <div className="flex items-center gap-1 w-full justify-center">
        <span className="flex-1 text-center text-sm min-w-0 truncate">{formatPriceOption(pendingOpt)}</span>
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
      <span className="absolute inset-0 flex items-center justify-center tabular-nums px-8 truncate">{displayText}</span>
      <DropdownMenu open={open} onOpenChange={setOpen}>
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
          {allOptions.map((opt) => (
            <DropdownMenuItem
              key={formatPriceOption(opt)}
              onSelect={() => { setPendingOpt(opt); setOpen(false); }}
            >
              {formatPriceOption(opt)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function EditableEmptyShareCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<number | null>(null);

  const sacrifice = row.original;
  const displayValue = sacrifice.empty_share ?? 0;

  const handleConfirm = useCallback(
    async () => {
      if (pendingValue === null) return;
      setSaving(true);
      try {
        const { data } = await updateSacrificeApi(
          sacrifice.sacrifice_id,
          sacrifice.sacrifice_year,
          { empty_share: pendingValue },
          session?.user?.email ?? "Sistem"
        );
        updateSacrifice({ ...sacrifice, ...data });
        triggerSacrificeRefresh();
        toast({ title: "Güncellendi" });
        setPendingValue(null);
        setOpen(false);
      } catch (e) {
        toast({ title: "Hata", description: e instanceof Error ? e.message : "Güncelleme başarısız", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [pendingValue, sacrifice, session?.user?.email, updateSacrifice, toast]
  );

  const handleCancel = useCallback(() => {
    setPendingValue(null);
    setOpen(false);
  }, []);

  if (pendingValue !== null) {
    return (
      <div className="flex items-center gap-1 w-full justify-center">
        <span className="flex-1 text-center text-sm min-w-0">{pendingValue}</span>
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
      <span className="absolute inset-0 flex items-center justify-center truncate px-8">{displayValue}</span>
      <DropdownMenu open={open} onOpenChange={setOpen}>
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
          {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
            <DropdownMenuItem
              key={n}
              onSelect={() => { setPendingValue(n); setOpen(false); }}
            >
              {n}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function EditableNotesCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(row.original.notes || "");
  const [saving, setSaving] = useState(false);

  const sacrifice = row.original;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data } = await updateSacrificeApi(
        sacrifice.sacrifice_id,
        sacrifice.sacrifice_year,
        { notes: value.trim() },
        session?.user?.email ?? "Sistem"
      );
      updateSacrifice({ ...sacrifice, ...data });
      toast({ title: "Güncellendi" });
      setOpen(false);
    } catch (e) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Güncelleme başarısız", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [value, sacrifice, session?.user?.email, updateSacrifice, toast]);

  const notes = sacrifice.notes || "";

  return (
    <>
      <div className="group relative w-full min-h-[2rem] flex items-center min-w-0 text-left">
        {notes ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute inset-0 flex items-start justify-start truncate px-8 py-1 text-sm text-left cursor-default">
                {notes}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs whitespace-pre-wrap break-words">
              {notes}
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="absolute inset-0 flex items-start justify-start truncate px-8 py-1 text-sm text-left cursor-default">
            -
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => { setValue(notes); setOpen(true); }}
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
            className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Not ekleyin..."
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
