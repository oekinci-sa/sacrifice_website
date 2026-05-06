"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
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
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sms/templates?active=false");
      const data = await res.json();
      setTemplates(data.templates ?? []);
    } catch {
      toast({ title: "Şablonlar yüklenemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

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
      loadTemplates();
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu şablon pasife alınacak. Onaylıyor musunuz?")) return;
    try {
      const res = await fetch(`/api/admin/sms/templates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Silme başarısız", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Şablon pasife alındı" });
      loadTemplates();
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    }
  };

  const categoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SMS Şablonları</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Yeniden kullanılabilir SMS mesaj içerikleri.
          </p>
        </div>
        <Button onClick={openCreate} className="admin-tenant-accent">
          <PlusIcon className="h-4 w-4 mr-2" />
          Yeni Şablon
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Henüz şablon oluşturulmadı.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card
              key={t.id}
              className={cn("shadow-none rounded-md", !t.is_active && "opacity-50")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {t.title}
                  </CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(t)}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(t.id)}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {categoryLabel(t.category)}
                  </Badge>
                  {!t.is_active && (
                    <Badge variant="outline" className="text-xs">Pasif</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-3 font-mono whitespace-pre-wrap">
                  {t.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
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
    </div>
  );
}
