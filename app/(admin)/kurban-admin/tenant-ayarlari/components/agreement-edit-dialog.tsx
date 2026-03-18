"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { AgreementTerm, TenantSettingRow } from "./columns";

interface AgreementEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: TenantSettingRow | null;
  onSuccess: () => void;
}

export function AgreementEditDialog({
  open,
  onOpenChange,
  row,
  onSuccess,
}: AgreementEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [jsonValue, setJsonValue] = useState("[]");

  useEffect(() => {
    if (row?.agreement_terms && Array.isArray(row.agreement_terms) && row.agreement_terms.length > 0) {
      setJsonValue(JSON.stringify(row.agreement_terms, null, 2));
    } else {
      setJsonValue("[]");
    }
  }, [row]);

  const handleSave = async () => {
    if (!row) return;

    setLoading(true);
    try {
      let terms: AgreementTerm[] = [];
      try {
        const raw = JSON.parse(jsonValue);
        terms = Array.isArray(raw)
          ? raw.filter((t: unknown) => t && typeof t === "object" && "title" in t && "description" in t) as AgreementTerm[]
          : [];
      } catch {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Geçerli bir JSON dizisi girin.",
        });
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/tenant-settings/${row.tenant_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreement_terms: terms }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Güncelleme başarısız");
      }

      toast({ title: "Başarılı", description: "Sözleşme güncellendi." });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err instanceof Error ? err.message : "Beklenmeyen hata",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!row) return null;

  const tenantName =
    typeof row.tenants === "object" && row.tenants && "name" in row.tenants
      ? String((row.tenants as { name?: string }).name ?? row.tenant_id)
      : row.tenant_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sözleşme Düzenle — {tenantName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <Textarea
            className="font-mono text-sm min-h-[300px]"
            value={jsonValue}
            onChange={(e) => setJsonValue(e.target.value)}
            placeholder='[{"title": "...", "description": "..."}]'
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
