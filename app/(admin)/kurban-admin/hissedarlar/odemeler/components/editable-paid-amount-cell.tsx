"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { shareholderSchema } from "@/types";
import { Row } from "@tanstack/react-table";
import { Check, Pencil, X } from "lucide-react";
import { useCallback, useState } from "react";

interface EditablePaidAmountCellProps {
  row: Row<shareholderSchema>;
  lastEditedBy: string;
  onUpdate: (shareholder: shareholderSchema) => void;
}

export function EditablePaidAmountCell({
  row,
  lastEditedBy,
  onUpdate,
}: EditablePaidAmountCellProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const paidAmount = parseFloat(row.original.paid_amount.toString());
  const totalAmount = parseFloat(row.original.total_amount.toString());

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " TL";

  const handleStartEdit = useCallback(() => {
    setEditValue(paidAmount.toString());
    setIsEditing(true);
  }, [paidAmount]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue("");
  }, []);

  const handleSave = useCallback(async () => {
    const numValue = parseFloat(editValue.replace(/\s/g, "").replace(",", "."));
    if (isNaN(numValue) || numValue < 0) {
      toast({
        title: "Geçersiz değer",
        description: "Lütfen geçerli bir tutar girin.",
        variant: "destructive",
      });
      return;
    }
    if (numValue > totalAmount) {
      toast({
        title: "Geçersiz değer",
        description: "Ödenen tutar toplam tutardan fazla olamaz.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/update-shareholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareholder_id: row.original.shareholder_id,
          paid_amount: numValue,
          last_edited_by: lastEditedBy,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Güncelleme başarısız");
      }

      const { data } = await res.json();
      onUpdate({ ...row.original, ...data, sacrifice: row.original.sacrifice });
      window.dispatchEvent(new Event("shareholders-updated"));
      toast({ title: "Ödeme güncellendi" });
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
  }, [
    editValue,
    totalAmount,
    row.original,
    lastEditedBy,
    onUpdate,
    toast,
  ]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="text"
          inputMode="numeric"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="h-8 w-24 text-sm tabular-nums"
          autoFocus
          disabled={saving}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={handleSave}
          disabled={saving}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-center gap-1 w-full">
      <span className="flex-1 text-center tabular-nums min-w-0 truncate">{formatCurrency(paidAmount)}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleStartEdit}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}
