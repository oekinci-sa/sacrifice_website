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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import {
  compareSmsAutoTemplatesByEventOrder,
  isSmsAutoEventKey,
  SMS_AUTO_EVENT_OPTIONS,
  SMS_STAGE_AUTO_EVENT_KEYS,
} from "@/lib/sms-event-keys";
import { cn } from "@/lib/utils";
import { Check, PlusCircle, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SmsEditor } from "../components/sms-editor";
import { SmsAutoEventHelpTooltip } from "../components/sms-auto-event-help-tooltip";
import { SmsAutoEventSettingsDialog } from "../components/sms-auto-event-settings-dialog";

const CATEGORIES = [
  { value: "genel", label: "Genel" },
  { value: "odeme", label: "Ödeme" },
  { value: "kesim", label: "Kesim" },
  { value: "teslimat", label: "Teslimat" },
  { value: "bilgilendirme", label: "Bilgilendirme" },
] as const;

const NONE_EVENT_KEY = "none" as const;

/** Şablon listesi filtre seçenekleri */
type TemplateFilterKey = "manual" | "auto" | "passive";

const TEMPLATE_FILTER_OPTIONS: { key: TemplateFilterKey; label: string }[] = [
  { key: "manual", label: "Sizin yazdıklarınız" },
  { key: "auto", label: "Otomatik SMS'ler" },
  { key: "passive", label: "Pasif SMS'ler" },
];

const DEFAULT_TEMPLATE_FILTERS = new Set<TemplateFilterKey>(["manual", "auto", "passive"]);

interface SmsTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: string;
  content_external: string | null;
  is_active: boolean;
  event_key: string | null;
  created_by: string;
  created_at: string;
}

interface FormState {
  title: string;
  description: string;
  category: string;
  content: string;
  content_external: string;
  is_active: boolean;
  event_key: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  category: "genel",
  content: "",
  content_external: "",
  is_active: true,
  event_key: NONE_EVENT_KEY,
};

export default function SmsTemplatesPage() {
  const [activeTemplates, setActiveTemplates] = useState<SmsTemplate[]>([]);
  const [inactiveTemplates, setInactiveTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [templateFilters, setTemplateFilters] = useState<Set<TemplateFilterKey>>(
    () => new Set(DEFAULT_TEMPLATE_FILTERS)
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  /** Pasife alma onayı — sadece manuel şablonlar için */
  const [deactivateTemplateId, setDeactivateTemplateId] = useState<string | null>(null);
  /** Otomatik SMS ayarlar dialog'u */
  const [autoSettingsTemplate, setAutoSettingsTemplate] = useState<SmsTemplate | null>(null);

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
    await loadInactiveTemplates();
  }, [loadActiveTemplates, loadInactiveTemplates]);

  const loadTemplatesInitial = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadActiveTemplates(), loadInactiveTemplates()]);
    } finally {
      setLoading(false);
    }
  }, [loadActiveTemplates, loadInactiveTemplates]);

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
      content_external: t.content_external ?? "",
      is_active: t.is_active,
      event_key: t.event_key ?? NONE_EVENT_KEY,
    });
    setDialogOpen(true);
  };

  const isDeliveryCompletedForm = form.event_key === "delivery_completed";

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Başlık ve içerik zorunlu", variant: "destructive" });
      return;
    }
    if (isDeliveryCompletedForm && !form.content_external.trim()) {
      toast({
        title: "Kesimhane dışı mesaj metni zorunlu",
        variant: "destructive",
      });
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
          content_external: isDeliveryCompletedForm
            ? form.content_external.trim()
            : null,
          event_key: form.event_key === NONE_EVENT_KEY ? null : form.event_key || null,
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

  const toggleTemplateFilter = (key: TemplateFilterKey) => {
    setTemplateFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else {
        next.add(key);
        if (key === "passive" && inactiveTemplates.length === 0) {
          void loadInactiveTemplates();
        }
      }
      return next;
    });
  };

  const isDefaultFilters =
    templateFilters.size === DEFAULT_TEMPLATE_FILTERS.size &&
    Array.from(DEFAULT_TEMPLATE_FILTERS).every((k) => templateFilters.has(k));

  const visibleActiveManual = useMemo(
    () =>
      templateFilters.has("manual")
        ? activeTemplates.filter((t) => !t.event_key)
        : [],
    [activeTemplates, templateFilters]
  );

  const visibleActiveAuto = useMemo(() => {
    if (!templateFilters.has("auto")) return [];
    return activeTemplates
      .filter((t) => Boolean(t.event_key))
      .slice()
      .sort(compareSmsAutoTemplatesByEventOrder);
  }, [activeTemplates, templateFilters]);

  const visiblePassive = useMemo(
    () => (templateFilters.has("passive") ? inactiveTemplates : []),
    [inactiveTemplates, templateFilters]
  );

  const hasVisibleTemplates =
    visibleActiveManual.length > 0 ||
    visibleActiveAuto.length > 0 ||
    visiblePassive.length > 0;

  /** Tüm otomatik event şablonları (ödeme dahil): ayarlar ikonu, silme yok. */
  const isAutoEventTemplate = (t: SmsTemplate) =>
    Boolean(t.event_key) && isSmsAutoEventKey(t.event_key);

  const renderTemplateCard = (t: SmsTemplate, opts?: { passive?: boolean }) => {
    const isAutoEvent = isAutoEventTemplate(t);
    return (
      <Card
        key={t.id}
        className={cn("shadow-none rounded-md", opts?.passive && "opacity-70")}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold leading-tight">{t.title}</CardTitle>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {isAutoEvent ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setAutoSettingsTemplate(t)}
                    title="Gönderim kuralları"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                  <SmsAutoEventHelpTooltip eventKey={t.event_key!} />
                </>
              ) : (
                /* Manuel SMS: pasife al ikonu */
                !opts?.passive && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeactivateTemplateId(t.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )
              )}
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap mt-1">
            <Badge variant="secondary" className="text-xs">
              {categoryLabel(t.category)}
            </Badge>
            {opts?.passive && (
              <Badge variant="outline" className="text-xs">
                Pasif
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {t.event_key === "delivery_completed" ? (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Kesimhaneden teslim alacaklar
                </p>
                <p className="text-sm font-normal leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                  {t.content}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Kesimhane dışında teslim alacaklar
                </p>
                <p className="text-sm font-normal leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                  {t.content_external?.trim() || "—"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm font-normal leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
              {t.content}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const isStageAutoEvent =
    form.event_key !== NONE_EVENT_KEY &&
    (SMS_STAGE_AUTO_EVENT_KEYS as readonly string[]).includes(form.event_key);

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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant={!isDefaultFilters ? "secondary" : "outline"}
                size="sm"
                className={cn("h-8 text-xs", isDefaultFilters ? "border-dashed" : "border-solid")}
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Şablonları filtrele
                <span className="ml-1.5 rounded bg-background px-1 py-0.5 text-xs font-medium border">
                  {templateFilters.size}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Şablonları filtrele
              </p>
              <div className="mt-1 space-y-0.5">
                {TEMPLATE_FILTER_OPTIONS.map((o) => {
                  const checked = templateFilters.has(o.key);
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => toggleTemplateFilter(o.key)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        )}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </div>
                      {o.label}
                    </button>
                  );
                })}
              </div>
              {!isDefaultFilters && (
                <button
                  type="button"
                  onClick={() => setTemplateFilters(new Set(DEFAULT_TEMPLATE_FILTERS))}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent border-t pt-2"
                >
                  <X className="h-3 w-3" />
                  Varsayılana dön
                </button>
              )}
            </PopoverContent>
          </Popover>
          <Button onClick={openCreate} className="admin-tenant-accent" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Şablon
          </Button>
        </div>
      </div>

      {loading || (templateFilters.has("passive") && loadingInactive) ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : !hasVisibleTemplates ? (
        <div className="text-center py-12 text-muted-foreground">
          {templateFilters.size === 0
            ? "Gösterilecek şablon seçin."
            : "Seçili filtrelere uygun şablon yok."}
        </div>
      ) : (
        <div className="space-y-8">
          {visibleActiveManual.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Sizin yazdıklarınız</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleActiveManual.map((t) => renderTemplateCard(t))}
              </div>
            </section>
          )}
          {visibleActiveAuto.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Otomatik SMS&apos;ler</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleActiveAuto.map((t) => renderTemplateCard(t))}
              </div>
            </section>
          )}
          {visiblePassive.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Pasif SMS&apos;ler</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visiblePassive.map((t) => renderTemplateCard(t, { passive: true }))}
              </div>
            </section>
          )}
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
              <Label>Otomatik gönderim için</Label>
              <Select
                value={form.event_key}
                onValueChange={(v) => setForm((f) => ({ ...f, event_key: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Yalnızca manuel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_EVENT_KEY}>Yalnızca manuel</SelectItem>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Kurban günü (sıra sayfaları)</SelectLabel>
                    {SMS_AUTO_EVENT_OPTIONS.filter((o) => o.value !== "payment_amount_updated").map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Ödeme</SelectLabel>
                    <SelectItem value="payment_amount_updated">
                      {SMS_AUTO_EVENT_OPTIONS.find((o) => o.value === "payment_amount_updated")?.label}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Kurban günü: sıra sayfasında aşama tamamlanınca. Ödeme: ödenen tutar güncellenince (SMS açık tenant).
              </p>
            </div>
            <div className="space-y-2">
              <Label>Açıklama (opsiyonel)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Bu şablonun kullanım amacı..."
              />
            </div>
            {isDeliveryCompletedForm ? (
              <>
                <div className="space-y-2">
                  <Label>Kesimhaneden teslim alacaklar *</Label>
                  <SmsEditor
                    value={form.content}
                    onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                    showAutoVariables={isStageAutoEvent}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kesimhane dışında teslim alacaklar *</Label>
                  <SmsEditor
                    value={form.content_external}
                    onChange={(v) => setForm((f) => ({ ...f, content_external: v }))}
                    showAutoVariables={isStageAutoEvent}
                  />
                </div>
              </>
            ) : (
              <SmsEditor
                value={form.content}
                onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                showAutoVariables={isStageAutoEvent}
              />
            )}
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

      {autoSettingsTemplate && (
        <SmsAutoEventSettingsDialog
          open={autoSettingsTemplate !== null}
          onOpenChange={(v) => { if (!v) setAutoSettingsTemplate(null); }}
          templateId={autoSettingsTemplate.id}
          eventKey={autoSettingsTemplate.event_key!}
          templateTitle={autoSettingsTemplate.title}
          isTemplateActive={autoSettingsTemplate.is_active}
          onSuccess={() => {
            setAutoSettingsTemplate(null);
            void reloadVisibleLists();
          }}
        />
      )}
    </div>
  );
}


