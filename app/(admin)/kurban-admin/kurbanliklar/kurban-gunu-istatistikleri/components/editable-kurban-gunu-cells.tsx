"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { parseDecimalInput } from "@/lib/decimal-input";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { Row } from "@tanstack/react-table";
import { Check, Pencil, X } from "lucide-react";
import { memo, useCallback, useState } from "react";
import type { KurbanGunuAnimalRow } from "./animal-columns";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function isoToTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function timeInputToIso(
  timeInput: string,
  referenceIso: string | null
): string | null {
  if (!timeInput.trim()) return null;
  const [hh, mm] = timeInput.split(":").map((s) => parseInt(s, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const base = referenceIso ? new Date(referenceIso) : new Date();
  base.setHours(hh, mm, 0, 0);
  return base.toISOString();
}

async function patchKurbanGunuField(
  sacrificeId: string,
  sacrificeYear: number | null | undefined,
  payload: Record<string, unknown>
) {
  const body: Record<string, unknown> = { sacrifice_id: sacrificeId, ...payload };
  if (sacrificeYear != null) body.sacrifice_year = sacrificeYear;
  const res = await fetch("/api/admin/sacrifice-animals/kurban-gunu-fields", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Güncelleme başarısız");
  }
  return res.json() as Promise<KurbanGunuAnimalRow>;
}

type TimeField = "slaughter_time" | "butcher_time" | "delivery_time";

export const EditableStageTimeCell = memo(function EditableStageTimeCell({
  row,
  field,
  onUpdate,
}: {
  row: Row<KurbanGunuAnimalRow>;
  field: TimeField;
  onUpdate: (animal: KurbanGunuAnimalRow) => void;
}) {
  const { toast } = useToast();
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const animal = row.original;
  const currentIso = animal[field];
  const referenceIso =
    currentIso ??
    animal.slaughter_time ??
    animal.butcher_time ??
    animal.delivery_time ??
    null;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = useCallback(() => {
    setEditValue(isoToTimeInput(currentIso));
    setIsEditing(true);
  }, [currentIso]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setEditValue("");
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const iso = timeInputToIso(editValue, referenceIso);
      const updated = await patchKurbanGunuField(animal.sacrifice_id, selectedYear, {
        [field]: iso,
      });
      onUpdate({ ...animal, ...updated });
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
  }, [animal, editValue, field, onUpdate, referenceIso, selectedYear, toast]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[7rem]">
        <Input
          type="time"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-8 text-sm tabular-nums"
          disabled={saving}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={cancel}
          disabled={saving}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          className="h-7 w-7 shrink-0 bg-white border border-sac-primary text-sac-primary hover:bg-sac-primary-lightest"
          onClick={() => void save()}
          disabled={saving}
        >
          <Check className="h-3.5 w-3.5 text-sac-primary" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group relative w-full min-h-[2rem] flex items-center min-w-0">
      <span
        className={`flex-1 px-8 pr-9 py-1 tabular-nums ${
          currentIso ? "" : "text-muted-foreground"
        }`}
      >
        {formatTime(currentIso)}
      </span>
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
});

export const EditableDeliveredKgCell = memo(function EditableDeliveredKgCell({
  row,
  onUpdate,
}: {
  row: Row<KurbanGunuAnimalRow>;
  onUpdate: (animal: KurbanGunuAnimalRow) => void;
}) {
  const { toast } = useToast();
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const animal = row.original;
  const kg = animal.delivered_share_kg;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const display =
    kg == null
      ? "—"
      : `${Number(kg).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} kg`;

  const startEdit = useCallback(() => {
    setEditValue(kg == null ? "" : String(kg).replace(".", ","));
    setIsEditing(true);
  }, [kg]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setEditValue("");
  }, []);

  const save = useCallback(async () => {
    const parsed = editValue.trim() === "" ? null : parseDecimalInput(editValue);
    if (editValue.trim() !== "" && (parsed === null || parsed < 0)) {
      toast({
        title: "Geçersiz değer",
        description: "Lütfen geçerli bir kg değeri girin.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const updated = await patchKurbanGunuField(animal.sacrifice_id, selectedYear, {
        delivered_share_kg: parsed,
      });
      onUpdate({ ...animal, ...updated });
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
  }, [animal, editValue, onUpdate, selectedYear, toast]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[7rem]">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="kg"
          className="h-8 text-sm tabular-nums"
          disabled={saving}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={cancel} disabled={saving}>
          <X className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          className="h-7 w-7 shrink-0 bg-white border border-sac-primary text-sac-primary hover:bg-sac-primary-lightest"
          onClick={() => void save()}
          disabled={saving}
        >
          <Check className="h-3.5 w-3.5 text-sac-primary" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group relative w-full min-h-[2rem] flex items-center min-w-0">
      <span
        className={`flex-1 px-8 pr-9 py-1 tabular-nums ${
          kg == null ? "text-muted-foreground" : ""
        }`}
      >
        {display}
      </span>
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
});

export const EditableDeliveryNotesCell = memo(function EditableDeliveryNotesCell({
  row,
  onUpdate,
}: {
  row: Row<KurbanGunuAnimalRow>;
  onUpdate: (animal: KurbanGunuAnimalRow) => void;
}) {
  const { toast } = useToast();
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const animal = row.original;
  const notes = animal.delivery_notes?.trim() ?? "";

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = useCallback(() => {
    setEditValue(notes);
    setIsEditing(true);
  }, [notes]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setEditValue("");
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await patchKurbanGunuField(animal.sacrifice_id, selectedYear, {
        delivery_notes: editValue.trim() || null,
      });
      onUpdate({ ...animal, ...updated });
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
  }, [animal, editValue, onUpdate, selectedYear, toast]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[10rem]">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-8 text-sm"
          disabled={saving}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={cancel} disabled={saving}>
          <X className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          className="h-7 w-7 shrink-0 bg-white border border-sac-primary text-sac-primary hover:bg-sac-primary-lightest"
          onClick={() => void save()}
          disabled={saving}
        >
          <Check className="h-3.5 w-3.5 text-sac-primary" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group relative w-full min-h-[2rem] flex items-center min-w-0 text-left">
      {notes ? (
        <span className="flex-1 text-left px-8 pr-9 py-1 text-sm block max-w-[240px] truncate" title={notes}>
          {notes}
        </span>
      ) : (
        <span className="flex-1 text-left px-8 pr-9 py-1 text-sm text-muted-foreground">—</span>
      )}
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
});
