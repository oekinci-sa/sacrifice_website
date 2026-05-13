"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SmsEditor } from "../components/sms-editor";

const CATEGORIES = [
  { value: "genel", label: "Genel" },
  { value: "odeme", label: "Ödeme" },
  { value: "kesim", label: "Kesim" },
  { value: "teslimat", label: "Teslimat" },
  { value: "bilgilendirme", label: "Bilgilendirme" },
] as const;

interface SmsTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

interface FormState {
  title: string;
  description: string;
  category: string;
  content: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  category: "genel",
  content: "",
  is_active: true,
};

export default function SmsTemplatesPage() {
  const [activeTemplates, setActiveTemplates] = useState<SmsTemplate[]>([]);
  const [inactiveTemplates, setInactiveTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  /** Pasife alma onayı (native confirm yerine) */
  const [deactivateTemplateId, setDeactivateTemplateId] = useState<string | null>(null);

  const loadActiveTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sms/templates");
      const data = await res.json();
      setActiveTemplates(data.templates ?? []);
    } catch {
      toast({ title: "Şablonlar yüklenemedi", variant: "destructive" });
    }
  }, []);

  const loadInactiveTemplates = useCallback(async () => {
    setLoadingInactive(true);
    try {
      const res = await fetch("/api/admin/sms/templates?inactive=true");
      const data = await res.json();
      setInactiveTemplates(data.templates ?? []);
    } catch {
      toast({ title: "Pasif şablonlar yüklenemedi", variant: "destructive" });
      setInactiveTemplates([]);
    } finally {
      setLoadingInactive(false);
    }
  }, []);

  const reloadVisibleLists = useCallback(async () => {
    await loadActiveTemplates();
    if (showInactive) await loadInactiveTemplates();
  }, [loadActiveTemplates, loadInactiveTemplates, showInactive]);

  const loadTemplatesInitial = useCallback(async () => {
    setLoading(true);
    try {
      await loadActiveTemplates();
    } finally {
      setLoading(false);
    }
  }, [loadActiveTemplates]);

  useEffect(() => {
    loadTemplatesInitial();
  }, [loadTemplatesInitial]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (t: SmsTemplate) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      description: t.description ?? "",
      category: t.category,
      content: t.content,
      is_active: t.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Başlık ve içerik zorunlu", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/sms/templates/${editingId}`
        : "/api/admin/sms/templates";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          description: form.description || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Kayıt başarısız", description: data.error, variant: "destructive" });
        return;
      }

      toast({ title: editingId ? "Şablon güncellendi" : "Şablon oluşturuldu" });
      setDialogOpen(false);
      reloadVisibleLists();
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivateTemplate = async () => {
    const id = deactivateTemplateId;
    if (!id) return;
    setDeactivateTemplateId(null);
    try {
      const res = await fetch(`/api/admin/sms/templates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Silme başarısız", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Şablon pasife alındı" });
      reloadVisibleLists();
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    }
  };

  const categoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">SMS Şablonları</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Yeniden kullanılabilir SMS mesaj içerikleri.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant={showInactive ? "secondary" : "outline"}
            size="sm"
            disabled={loadingInactive}
            className={showInactive ? "" : "border-dashed"}
            onClick={() => {
              void (async () => {
                if (!showInactive) {
                  await loadInactiveTemplates();
                  setShowInactive(true);
                } else setShowInactive(false);
              })();
            }}
          >
            {loadingInactive
              ? "Yükleniyor…"
              : showInactive
                ? "Pasif şablonları gizle"
                : "Pasif şablonları da göster"}
          </Button>
          <Button onClick={openCreate} className="admin-tenant-accent" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Şablon
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : activeTemplates.length === 0 && !showInactive ? (
        <div className="text-center py-12 text-muted-foreground">
          Henüz aktif şablon yok.
        </div>
      ) : (
        <>
          {activeTemplates.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeTemplates.map((t) => (
                <Card key={t.id} className="shadow-none rounded-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold leading-tight">{t.title}</CardTitle>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeactivateTemplateId(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabel(t.category)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-normal leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                      {t.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {showInactive && (
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-medium text-muted-foreground">Pasif şablonlar</h2>
              {inactiveTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Pasif şablon kaydı yok.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inactiveTemplates.map((t) => (
                    <Card key={t.id} className={cn("shadow-none rounded-md opacity-70")}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold leading-tight">{t.title}</CardTitle>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabel(t.category)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Pasif
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-normal leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                          {t.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Şablonu Düzenle" : "Yeni Şablon"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Başlık *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Kapora hatırlatma, Kesim saati..."
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Açıklama (opsiyonel)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Bu şablonun kullanım amacı..."
              />
            </div>
            <SmsEditor
              value={form.content}
              onChange={(v) => setForm((f) => ({ ...f, content: v }))}
            />
            <div className="flex items-center justify-between">
              <Label htmlFor="template-active">Aktif</Label>
              <Switch
                id="template-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="admin-tenant-accent">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deactivateTemplateId !== null}
        onOpenChange={(o) => !o && setDeactivateTemplateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şablonu pasife al</AlertDialogTitle>
            <AlertDialogDescription>
              Bu şablon pasife alınacak. Gönderim geçmişi korunur. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeactivateTemplate()}>
              Pasife al
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
