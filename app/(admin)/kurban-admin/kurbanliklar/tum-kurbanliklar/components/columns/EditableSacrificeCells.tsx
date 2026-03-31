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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { AdminSacrificeHisseBedeliCell } from "@/lib/admin-sacrifice-hisse-bedeli";
import { isLiveScaleSacrifice } from "@/lib/live-scale-share";
import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { triggerSacrificeRefresh } from "@/utils/data-refresh";
import { sacrificeSchema } from "@/types";
import { Row } from "@tanstack/react-table";
import { Check, Pencil, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { getDefaultPriceInfoByTenant } from "@/lib/price-info-by-tenant";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import {
  mergeHourMinuteToPostgresTime,
  sanitizeHourDigitsInput,
  sanitizeMinuteDigitsInput,
} from "@/utils/formatters";

type PriceOption = { kg: string; price: string } | { kg: number; price: number };

type UpdateSacrificePayload = Partial<{
  share_weight: number | null;
  share_price: number | null;
  pricing_mode: string;
  live_scale_total_kg: number | null;
  live_scale_total_price: number | null;
  empty_share: number;
  animal_type: string | null;
  foundation: string | null;
  notes: string;
  ear_tag: string | null;
  barn_stall_order_no: string | null;
  /** TIME (HH:MM:SS) — Postgres `time` */
  planned_delivery_time?: string | null;
}>;

async function updateSacrificeApi(
  sacrificeId: string,
  sacrificeYear: number | undefined,
  payload: UpdateSacrificePayload
) {
  const body: Record<string, unknown> = {
    sacrifice_id: sacrificeId,
    ...payload,
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

function parseTrDecimal(input: string): number | null {
  const t = input.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function EditableSharePriceCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
  const branding = useTenantBranding();
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [options, setOptions] = useState<PriceOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState<"fixed" | "live">("fixed");
  const [liveKg, setLiveKg] = useState("");
  const [liveTotal, setLiveTotal] = useState("");
  const [selectedFixed, setSelectedFixed] = useState<PriceOption | null>(null);

  const sacrifice = row.original;

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

  // row.original her render'da yeni referans olabilir; alan bazlı senkron yeterli
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sacrifice nesnesi değil primitive alanlar
  useEffect(() => {
    if (!dialogOpen) return;
    setTab(isLiveScaleSacrifice(sacrifice) ? "live" : "fixed");
    setLiveKg(
      sacrifice.live_scale_total_kg != null ? String(sacrifice.live_scale_total_kg) : ""
    );
    setLiveTotal(
      sacrifice.live_scale_total_price != null
        ? String(sacrifice.live_scale_total_price)
        : ""
    );
    setSelectedFixed(null);
  }, [
    dialogOpen,
    sacrifice.sacrifice_id,
    sacrifice.pricing_mode,
    sacrifice.live_scale_total_kg,
    sacrifice.live_scale_total_price,
    sacrifice.share_weight,
    sacrifice.share_price,
  ]);

  const currentInOptions = options.some(
    (o) => Math.abs(getKg(o) - (sacrifice.share_weight ?? 0)) < 0.01
  );
  const allOptions = currentInOptions
    ? options
    : [...options, { kg: sacrifice.share_weight ?? 0, price: sacrifice.share_price ?? 0 }].sort(
        (a, b) => getPrice(a) - getPrice(b)
      );

  const handleSaveFixed = useCallback(async () => {
    if (!selectedFixed) {
      toast({
        title: "Seçim gerekli",
        description: "Listeden kg ve tutar seçin.",
        variant: "destructive",
      });
      return;
    }
    const kg = getKg(selectedFixed);
    const price = getPrice(selectedFixed);
    setSaving(true);
    try {
      const { data } = await updateSacrificeApi(sacrifice.sacrifice_id, sacrifice.sacrifice_year, {
        pricing_mode: "fixed",
        share_weight: kg,
        share_price: price,
        live_scale_total_kg: null,
        live_scale_total_price: null,
      });
      updateSacrifice({ ...sacrifice, ...data });
      triggerSacrificeRefresh();
      toast({ title: "Güncellendi" });
      setDialogOpen(false);
    } catch (e) {
      toast({
        title: "Hata",
        description: e instanceof Error ? e.message : "Güncelleme başarısız",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [selectedFixed, sacrifice, updateSacrifice, toast]);

  const handleSaveLive = useCallback(async () => {
    const kgTrim = liveKg.trim();
    const totalTrim = liveTotal.trim();

    const patch: UpdateSacrificePayload = {
      pricing_mode: "live_scale",
      share_price: null,
      share_weight: null,
    };

    if (kgTrim === "") {
      patch.live_scale_total_kg = null;
    } else {
      const kgNum = parseTrDecimal(liveKg);
      if (kgNum == null || kgNum <= 0) {
        toast({
          title: "Geçersiz ağırlık",
          description: "Boş bırakın (silinsin) veya pozitif bir sayı girin.",
          variant: "destructive",
        });
        return;
      }
      patch.live_scale_total_kg = kgNum;
    }

    if (totalTrim === "") {
      patch.live_scale_total_price = null;
    } else {
      const priceNum = parseTrDecimal(liveTotal);
      if (priceNum == null || priceNum <= 0) {
        toast({
          title: "Geçersiz tutar",
          description: "Boş bırakın (silinsin) veya pozitif bir sayı girin.",
          variant: "destructive",
        });
        return;
      }
      patch.live_scale_total_price = priceNum;
    }

    setSaving(true);
    try {
      const { data } = await updateSacrificeApi(sacrifice.sacrifice_id, sacrifice.sacrifice_year, patch);
      updateSacrifice({ ...sacrifice, ...data });
      triggerSacrificeRefresh();
      toast({ title: "Güncellendi" });
      setDialogOpen(false);
    } catch (e) {
      toast({
        title: "Hata",
        description: e instanceof Error ? e.message : "Güncelleme başarısız",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [liveKg, liveTotal, sacrifice, updateSacrifice, toast]);

  const handleTabChange = useCallback(
    (v: string) => {
      const next = v as "fixed" | "live";
      setTab(next);
      if (next === "live") {
        setLiveKg(
          sacrifice.live_scale_total_kg != null ? String(sacrifice.live_scale_total_kg) : ""
        );
        setLiveTotal(
          sacrifice.live_scale_total_price != null
            ? String(sacrifice.live_scale_total_price)
            : ""
        );
      }
    },
    [sacrifice.live_scale_total_kg, sacrifice.live_scale_total_price]
  );

  return (
    <>
      <div className="group relative w-full min-h-[2.5rem] flex items-center justify-center px-1">
        <div className="text-center px-7 pr-9 max-w-full whitespace-normal w-full">
          <AdminSacrificeHisseBedeliCell sacrifice={sacrifice} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setDialogOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hisse fiyatı</DialogTitle>
          </DialogHeader>
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fixed">Sabit fiyat</TabsTrigger>
              <TabsTrigger value="live">Canlı baskül</TabsTrigger>
            </TabsList>
            <TabsContent value="fixed" className="space-y-3 pt-3">
              <p className="text-sm text-muted-foreground">
                Standart kg ve tutar listesinden seçin. Kayıt sabit hisse bedeli olarak uygulanır.
              </p>
              <div className="max-h-[220px] overflow-y-auto rounded-md border p-1 space-y-0.5">
                {allOptions.map((opt) => (
                  <button
                    key={formatPriceOption(opt)}
                    type="button"
                    className={`w-full text-left rounded-sm px-3 py-2 text-sm hover:bg-muted ${
                      selectedFixed && formatPriceOption(selectedFixed) === formatPriceOption(opt)
                        ? "bg-muted font-medium"
                        : ""
                    }`}
                    onClick={() => setSelectedFixed(opt)}
                  >
                    {formatPriceOption(opt)}
                  </button>
                ))}
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  İptal
                </Button>
                <Button type="button" onClick={() => void handleSaveFixed()} disabled={saving}>
                  Kaydet
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="live" className="space-y-3 pt-3">
              <p className="text-sm text-muted-foreground">
                Alanları boş bırakıp kaydettiğinizde o alan veritabanında temizlenir (NULL).
                Toplam tutar girildiğinde hisse başı tutar hissedar sayısına göre dağıtılır.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Toplam kg (baskül)</label>
                <Input
                  inputMode="decimal"
                  value={liveKg}
                  onChange={(e) => setLiveKg(e.target.value)}
                  placeholder="Örn. 480"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Toplam tutar (TL)</label>
                <Input
                  inputMode="decimal"
                  value={liveTotal}
                  onChange={(e) => setLiveTotal(e.target.value)}
                  placeholder="Örn. 264000"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  İptal
                </Button>
                <Button type="button" onClick={() => void handleSaveLive()} disabled={saving}>
                  Kaydet
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditableEmptyShareCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
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
          { empty_share: pendingValue }
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
    [pendingValue, sacrifice, updateSacrifice, toast]
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
      <span className="flex-1 text-center px-8 pr-9">{displayValue}</span>
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

const ANIMAL_TYPE_OPTIONS = ["Dana", "Düve", ""] as const;

const FOUNDATION_OPTIONS = ["", "AKV", "İMH", "AGD"] as const;

export function EditableFoundationCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
  const [open, setOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sacrifice = row.original;

  const handleConfirm = useCallback(async () => {
    if (pendingValue === null) return;
    setSaving(true);
    try {
      const { data } = await updateSacrificeApi(
        sacrifice.sacrifice_id,
        sacrifice.sacrifice_year,
        { foundation: pendingValue === "" ? null : pendingValue }
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
  }, [pendingValue, sacrifice, updateSacrifice, toast]);

  const handleCancel = useCallback(() => {
    setPendingValue(null);
    setOpen(false);
  }, []);

  const displayValue = sacrifice.foundation?.trim() || "-";

  if (pendingValue !== null) {
    return (
      <div className="flex items-center gap-1 w-full justify-center">
        <span className="flex-1 text-center text-sm min-w-0">{pendingValue || "-"}</span>
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
      <span className="flex-1 text-center px-8 pr-9">{displayValue}</span>
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
          {FOUNDATION_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt || "_empty"}
              onSelect={() => { setPendingValue(opt); setOpen(false); }}
            >
              {opt || "— Boş"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function EditableAnimalTypeCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
  const [open, setOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sacrifice = row.original;

  const handleConfirm = useCallback(async () => {
    if (pendingValue === null) return;
    setSaving(true);
    try {
      const { data } = await updateSacrificeApi(
        sacrifice.sacrifice_id,
        sacrifice.sacrifice_year,
        { animal_type: pendingValue === "" ? null : pendingValue }
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
  }, [pendingValue, sacrifice, updateSacrifice, toast]);

  const handleCancel = useCallback(() => {
    setPendingValue(null);
    setOpen(false);
  }, []);

  const displayValue = sacrifice.animal_type ?? "-";

  if (pendingValue !== null) {
    return (
      <div className="flex items-center gap-1 w-full justify-center">
        <span className="flex-1 text-center text-sm min-w-0">{pendingValue || "-"}</span>
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
      <span className="flex-1 text-center px-8 pr-9">{displayValue}</span>
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
          {ANIMAL_TYPE_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt || "_empty"}
              onSelect={() => { setPendingValue(opt); setOpen(false); }}
            >
              {opt || "-"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function effectiveEarTagLabel(s: sacrificeSchema): string {
  return (s.ear_tag ?? "").trim() || "-";
}

function effectiveBarnStallOrderLabel(s: sacrificeSchema): string {
  return (s.barn_stall_order_no ?? "").trim() || "-";
}

export function EditableBarnStallOrderCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const sacrifice = row.original;
  const display = effectiveBarnStallOrderLabel(sacrifice);
  const current = (sacrifice.barn_stall_order_no ?? "").trim();

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const t = value.trim();
      const payload: { barn_stall_order_no: string | null } =
        t === "" ? { barn_stall_order_no: null } : { barn_stall_order_no: t };
      const { data } = await updateSacrificeApi(
        sacrifice.sacrifice_id,
        sacrifice.sacrifice_year,
        payload
      );
      updateSacrifice({ ...sacrifice, ...data });
      triggerSacrificeRefresh();
      toast({ title: "Güncellendi" });
      setEditing(false);
    } catch (e) {
      toast({
        title: "Hata",
        description: e instanceof Error ? e.message : "Güncelleme başarısız",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [value, sacrifice, updateSacrifice, toast]);

  const handleCancel = useCallback(() => {
    setValue(current);
    setEditing(false);
  }, [current]);

  const startEdit = useCallback(() => {
    setValue(current);
    setEditing(true);
  }, [current]);

  if (editing) {
    return (
      <div className="flex items-center gap-1 w-full justify-center min-w-0 px-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="h-8 min-w-0 flex-1 max-w-[160px] text-sm"
          placeholder="Padok no"
          maxLength={128}
          autoFocus
          disabled={saving}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-50"
          onClick={() => void handleSave()}
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

  return (
    <div className="group relative w-full min-h-[2rem] flex items-center justify-center">
      <span className="text-sm px-8 pr-9 py-1 text-center">{display}</span>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={startEdit}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}

function splitHourMinuteFromDb(t: string | null | undefined): { h: string; m: string } {
  const s = String(t ?? "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return { h: "", m: "" };
  return { h: m[1].padStart(2, "0"), m: m[2] };
}

export function EditablePlannedDeliveryTimeCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
  const [editing, setEditing] = useState(false);
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [saving, setSaving] = useState(false);
  const minuteInputRef = useRef<HTMLInputElement>(null);
  const hourInputRef = useRef<HTMLInputElement>(null);
  const sacrifice = row.original;
  const displayRaw = sacrifice.planned_delivery_time;
  const display = formatPlanTimeDisplay(displayRaw);

  const applyFromDb = useCallback(() => {
    const { h, m } = splitHourMinuteFromDb(displayRaw ?? undefined);
    setHour(h);
    setMinute(m);
  }, [displayRaw]);

  const handleSave = useCallback(async () => {
    const pgTime = mergeHourMinuteToPostgresTime(hour, minute);
    if (!pgTime) {
      toast({
        title: "Geçersiz saat",
        description: "Saat ve dakikayı ikişer hane olarak girin (ör. 13 ve 45).",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        planned_delivery_time: pgTime,
      };
      const { data } = await updateSacrificeApi(
        sacrifice.sacrifice_id,
        sacrifice.sacrifice_year,
        payload
      );
      updateSacrifice({ ...sacrifice, ...data });
      triggerSacrificeRefresh();
      toast({ title: "Güncellendi" });
      setEditing(false);
    } catch (e) {
      toast({
        title: "Hata",
        description: e instanceof Error ? e.message : "Güncelleme başarısız",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [hour, minute, sacrifice, updateSacrifice, toast]);

  const handleCancel = useCallback(() => {
    applyFromDb();
    setEditing(false);
  }, [applyFromDb]);

  const startEdit = useCallback(() => {
    applyFromDb();
    setEditing(true);
  }, [applyFromDb]);

  const focusMinuteSelectAll = useCallback(() => {
    requestAnimationFrame(() => {
      const el = minuteInputRef.current;
      if (!el) return;
      el.focus();
      el.select();
    });
  }, []);

  const onHourChange = useCallback((raw: string) => {
    const next = sanitizeHourDigitsInput(raw);
    setHour(next);
    const n = parseInt(next, 10);
    if (next.length === 2 && !Number.isNaN(n) && n <= 23) {
      focusMinuteSelectAll();
    }
  }, [focusMinuteSelectAll]);

  if (editing) {
    return (
      <div className="flex items-center gap-1 w-full justify-center min-w-0 px-1">
        <div className="flex items-center gap-0.5 min-w-0 max-w-[140px]">
          <Input
            ref={hourInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="00"
            name="planned-delivery-hour"
            value={hour}
            onChange={(e) => onHourChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                focusMinuteSelectAll();
              }
              if (e.key === "Escape") handleCancel();
            }}
            className="h-8 w-11 min-w-0 px-1 text-center font-mono tabular-nums text-sm"
            maxLength={2}
            autoFocus
            disabled={saving}
            aria-label="Saat"
          />
          <span className="text-muted-foreground select-none" aria-hidden>
            :
          </span>
          <Input
            ref={minuteInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="00"
            name="planned-delivery-minute"
            value={minute}
            onFocus={(e) => {
              e.currentTarget.select();
            }}
            onChange={(e) => setMinute(sanitizeMinuteDigitsInput(e.target.value))}
            onKeyDown={(e) => {
              if (/^[0-9]$/.test(e.key) && minute.length === 2) {
                const el = e.currentTarget;
                const start = el.selectionStart ?? 0;
                const end = el.selectionEnd ?? 0;
                if (start === end) {
                  e.preventDefault();
                  setMinute(sanitizeMinuteDigitsInput(e.key));
                }
              }
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSave();
              }
              if (e.key === "Escape") handleCancel();
              if (e.key === "Backspace" && minute === "" && hourInputRef.current) {
                hourInputRef.current.focus();
              }
            }}
            className="h-8 w-11 min-w-0 px-1 text-center font-mono tabular-nums text-sm"
            maxLength={2}
            disabled={saving}
            aria-label="Dakika"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-50"
          onClick={() => void handleSave()}
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

  return (
    <div className="group relative w-full min-h-[2rem] flex items-center justify-center">
      <span className="text-sm px-8 pr-9 py-1 text-center tabular-nums">{display}</span>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={startEdit}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}

function formatPlanTimeDisplay(value: unknown): string {
  const time = value as string | undefined;
  if (!time) return "-";
  try {
    const [hours, minutes] = String(time).split(":");
    return `${hours}:${minutes}`;
  } catch {
    return "-";
  }
}

export function EditableEarTagCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const sacrifice = row.original;
  const display = effectiveEarTagLabel(sacrifice);
  const current = (sacrifice.ear_tag ?? "").trim();

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const t = value.trim();
      const payload: { ear_tag: string | null } =
        t === "" ? { ear_tag: null } : { ear_tag: t };
      const { data } = await updateSacrificeApi(
        sacrifice.sacrifice_id,
        sacrifice.sacrifice_year,
        payload
      );
      updateSacrifice({ ...sacrifice, ...data });
      triggerSacrificeRefresh();
      toast({ title: "Güncellendi" });
      setEditing(false);
    } catch (e) {
      toast({
        title: "Hata",
        description: e instanceof Error ? e.message : "Güncelleme başarısız",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [value, sacrifice, updateSacrifice, toast]);

  const handleCancel = useCallback(() => {
    setValue(current);
    setEditing(false);
  }, [current]);

  const startEdit = useCallback(() => {
    setValue(current);
    setEditing(true);
  }, [current]);

  if (editing) {
    return (
      <div className="flex items-center gap-1 w-full justify-center min-w-0 px-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="h-8 min-w-0 flex-1 max-w-[160px] font-mono tabular-nums text-sm"
          placeholder="Küpe no"
          maxLength={64}
          autoFocus
          disabled={saving}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-50"
          onClick={() => void handleSave()}
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

  return (
    <div className="group relative w-full min-h-[2rem] flex items-center justify-center">
      <span className="tabular-nums text-sm px-8 pr-9 py-1 text-center">{display}</span>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={startEdit}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}

export function EditableNotesCell({ row }: { row: Row<sacrificeSchema> }) {
  const { toast } = useToast();
  const updateSacrifice = useSacrificeStore((s) => s.updateSacrifice);
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
        { notes: value.trim() }
      );
      updateSacrifice({ ...sacrifice, ...data });
      toast({ title: "Güncellendi" });
      setOpen(false);
    } catch (e) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Güncelleme başarısız", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [value, sacrifice, updateSacrifice, toast]);

  const notes = sacrifice.notes || "";

  return (
    <>
      <div className="group relative w-full min-h-[2rem] flex items-center min-w-0 text-left">
        {notes ? (
          <span className="flex-1 text-left px-8 pr-9 py-1 text-sm">
            {notes}
          </span>
        ) : (
          <span className="flex-1 text-left px-8 pr-9 py-1 text-sm text-muted-foreground">
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
