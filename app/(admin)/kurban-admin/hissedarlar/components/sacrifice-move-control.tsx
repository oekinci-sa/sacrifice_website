"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { MISMATCHES_UPDATED_EVENT } from "@/hooks/useUnacknowledgedMismatchesCount";
import { cn } from "@/lib/utils";
import { useShareholderStore } from "@/stores/only-admin-pages/useShareholderStore";
import { shareholderSchema } from "@/types";
import { Check, ChevronsUpDown, Loader2, Pencil, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type SacrificeAnimalRow = {
  sacrifice_id: string;
  sacrifice_no: number;
  empty_share: number;
};

type Layout = "table" | "detail";

export function SacrificeMoveControl({
  shareholder,
  selectedYear,
  layout = "table",
}: {
  shareholder: shareholderSchema;
  /** Kurbanlık listesi için yıl (admin yıl seçici veya hissedarın sacrifice_year) */
  selectedYear: number | null;
  layout?: Layout;
}) {
  const { toast } = useToast();
  const updateShareholder = useShareholderStore((s) => s.updateShareholder);

  const sacrifice = shareholder.sacrifice;
  const displayNo = sacrifice?.sacrifice_no ?? "-";
  const currentNoNum =
    sacrifice?.sacrifice_no !== undefined && sacrifice?.sacrifice_no !== null
      ? Number(sacrifice.sacrifice_no)
      : NaN;

  const [isEditing, setIsEditing] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [animals, setAnimals] = useState<SacrificeAnimalRow[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(false);
  const [pendingNo, setPendingNo] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing || selectedYear == null) return;
    let cancelled = false;
    setLoadingAnimals(true);
    fetch(`/api/get-sacrifice-animals?year=${selectedYear}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        if (!Array.isArray(data)) {
          setAnimals([]);
          return;
        }
        setAnimals(
          data.map((a: Record<string, unknown>) => ({
            sacrifice_id: String(a.sacrifice_id),
            sacrifice_no: Number(a.sacrifice_no),
            empty_share: Number(a.empty_share ?? 0),
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setAnimals([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAnimals(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEditing, selectedYear]);

  const sortedAnimals = useMemo(() => {
    return [...animals].sort((a, b) => a.sacrifice_no - b.sacrifice_no);
  }, [animals]);

  const isSelectable = useCallback(
    (a: SacrificeAnimalRow) => {
      if (!Number.isFinite(currentNoNum)) return a.empty_share >= 1;
      return a.empty_share >= 1 || Number(a.sacrifice_no) === currentNoNum;
    },
    [currentNoNum]
  );

  const resetEditing = useCallback(() => {
    setIsEditing(false);
    setPopoverOpen(false);
    setPendingNo(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (pendingNo == null) return;
    if (Number.isFinite(currentNoNum) && pendingNo === currentNoNum) {
      toast({ title: "Bu kurbanlıkta zaten kayıtlısınız." });
      resetEditing();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/shareholders/${shareholder.shareholder_id}/move-sacrifice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_sacrifice_no: pendingNo }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Taşıma başarısız");
      }
      const data = json.data as shareholderSchema | undefined;
      if (data) {
        updateShareholder(data);
      }
      window.dispatchEvent(new Event("shareholders-updated"));
      window.dispatchEvent(new Event(MISMATCHES_UPDATED_EVENT));
      toast({ title: "Kurban sırası güncellendi" });
      resetEditing();
    } catch (e) {
      toast({
        title: "Hata",
        description: e instanceof Error ? e.message : "Taşıma başarısız",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [pendingNo, currentNoNum, shareholder.shareholder_id, toast, updateShareholder, resetEditing]);

  const handleCancel = useCallback(() => {
    resetEditing();
  }, [resetEditing]);

  if (displayNo === "-" || displayNo === "") {
    return <div className="tabular-nums">-</div>;
  }

  const pencilClass =
    layout === "table"
      ? "absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      : "h-8 w-8 shrink-0";

  if (pendingNo !== null) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 w-full",
          layout === "table" ? "justify-center min-w-[9rem]" : "justify-start flex-wrap"
        )}
      >
        <span className="flex-1 text-sm tabular-nums min-w-0 text-left">
          {currentNoNum} → {pendingNo}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-50"
          onClick={handleConfirm}
          disabled={saving}
          aria-label="Onayla"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleCancel}
          disabled={saving}
          aria-label="İptal"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 w-full",
          layout === "table" ? "justify-center" : "justify-start flex-wrap"
        )}
      >
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className={cn(
                "h-8 justify-between text-sm tabular-nums px-2",
                layout === "table" ? "min-w-[5.5rem] max-w-[8rem]" : "min-w-[7rem] max-w-[14rem]"
              )}
              disabled={loadingAnimals || selectedYear == null}
            >
              {loadingAnimals ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <>
                  <span className="truncate">{displayNo}</span>
                  <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Sıra no ara..." className="h-9" />
              <CommandList>
                <CommandEmpty>Kurbanlık bulunamadı.</CommandEmpty>
                <CommandGroup heading="Hedef kurbanlık">
                  {sortedAnimals.map((a) => {
                    const disabled = !isSelectable(a);
                    const label = `${a.sacrifice_no} (${a.empty_share} boş hisse)`;
                    return (
                      <CommandItem
                        key={a.sacrifice_id}
                        value={`${a.sacrifice_no} ${a.empty_share}`}
                        disabled={disabled}
                        title={disabled ? "Bu kurbanlıkta boş hisse yok." : undefined}
                        onSelect={() => {
                          if (disabled) return;
                          setPendingNo(a.sacrifice_no);
                          setPopoverOpen(false);
                        }}
                        className={cn(disabled && "opacity-50")}
                      >
                        <span className="tabular-nums">{label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => {
            resetEditing();
          }}
          aria-label="İptal"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center w-full min-h-[2rem]",
        layout === "table" ? "group relative justify-center" : "justify-start gap-2"
      )}
    >
      <span className={cn("tabular-nums", layout === "table" && "px-8 pr-9")}>{displayNo}</span>
      <Button
        variant="ghost"
        size="icon"
        className={pencilClass}
        onClick={() => setIsEditing(true)}
        aria-label="Kurban sırasını değiştir"
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}
