"use client";

import { Button } from "@/components/ui/button";
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
import {
  isSmsOffsetAutoEventKey,
  SMS_OFFSET_EVENT_FIXED_RULES_NOTES,
  SMS_STAGE_AUTO_EVENT_KEYS,
  smsAutoEventLabel,
} from "@/lib/sms-event-keys";
import { useEffect, useMemo, useState } from "react";

/** event_key → kilitli alıcı kapsamı (değiştirilemez). */
const LOCKED_SCOPE: Record<string, string> = {
  slaughter_approaching: "slaughterhouse_only",
  slaughter_imminent: "slaughterhouse_only",
};

/** event_key → izin verilen scope seçenekleri. */
const ALLOWED_SCOPES: Record<string, { value: string; label: string }[]> = {
  slaughter_completed: [
    { value: "all", label: "İlgili kurbanın tüm hissedarları" },
    { value: "slaughterhouse_only", label: "İlgili kurban — sadece Kesimhane teslim" },
    { value: "external_only", label: "İlgili kurban — sadece Kesimhane dışı" },
  ],
  butcher_started: [
    { value: "slaughterhouse_only", label: "İlgili kurban — sadece Kesimhane teslim" },
    { value: "all", label: "İlgili kurbanın tüm hissedarları" },
  ],
};

const SCOPE_DISPLAY_LABELS: Record<string, string> = {
  all: "İlgili kurbanın tüm hissedarları",
  slaughterhouse_only: "Sadece Kesimhane teslim",
  external_only: "Sadece Kesimhane dışı",
};

interface EventSettings {
  target_offset: number | null;
  recipient_scope: string;
}

interface SmsAutoEventSettingsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templateId: string;
  eventKey: string;
  templateTitle: string;
  isTemplateActive: boolean;
  onSuccess: () => void;
}

export function SmsAutoEventSettingsDialog({
  open,
  onOpenChange,
  templateId,
  eventKey,
  templateTitle,
  isTemplateActive,
  onSuccess,
}: SmsAutoEventSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggleSaving, setToggleSaving] = useState(false);

  const [form, setForm] = useState<EventSettings>({
    target_offset: null,
    recipient_scope: "all",
  });

  const isPaymentEvent = eventKey === "payment_amount_updated";
  const isDeliveryCompleted = eventKey === "delivery_completed";
  const isStageEvent = (SMS_STAGE_AUTO_EVENT_KEYS as readonly string[]).includes(eventKey);
  const isOffsetEvent = isSmsOffsetAutoEventKey(eventKey);
  // butcher_started'da target_offset bekleme süresi katsayısıdır (multiplier), offset event değil
  const isButcherMultiplierEvent = eventKey === "butcher_started";
  const hasConfigurableRules =
    isStageEvent &&
    !isDeliveryCompleted &&
    (isOffsetEvent || isButcherMultiplierEvent || Boolean(ALLOWED_SCOPES[eventKey]));

  const offsetLiveExample = useMemo(() => {
    const n = form.target_offset ?? 2;
    if (eventKey === "slaughter_approaching") {
      return `2 no kesildi + offset ${n} → ${2 + n} no hissedarlarına gider.`;
    }
    if (eventKey === "slaughter_imminent") {
      return `2 no kesildi + offset ${n} → ${2 + n} no hissedarlarına "kesilmek üzere" mesajı gider.`;
    }
    return null;
  }, [eventKey, form.target_offset]);

  useEffect(() => {
    if (!open || !hasConfigurableRules) return;
    setLoading(true);
    fetch("/api/admin/sms/auto-event-settings")
      .then((r) => r.json())
      .then((data: { settings?: (EventSettings & { event_key: string })[] }) => {
        const row = (data.settings ?? []).find((s) => s.event_key === eventKey);
        if (row) {
          setForm({
            target_offset: row.target_offset,
            recipient_scope: row.recipient_scope,
          });
        }
      })
      .catch(() => toast({ title: "Ayarlar yüklenemedi", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [open, eventKey, hasConfigurableRules]);

  const handleSave = async () => {
    if (!hasConfigurableRules) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/sms/auto-event-settings/${encodeURIComponent(eventKey)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Kayıt başarısız", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Gönderim kuralı güncellendi" });
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setToggleSaving(true);
    try {
      const url = `/api/admin/sms/templates/${encodeURIComponent(templateId)}`;
      const res = isTemplateActive
        ? await fetch(url, { method: "DELETE" })
        : await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: true }),
          });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "İşlem başarısız", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: isTemplateActive ? "Şablon pasife alındı" : "Şablon aktife alındı" });
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setToggleSaving(false);
    }
  };

  const lockedScope = LOCKED_SCOPE[eventKey];
  const allowedScopes = ALLOWED_SCOPES[eventKey];
  const eventLabel = smsAutoEventLabel(eventKey) ?? eventKey;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            Gönderim Kuralı — {eventLabel}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{templateTitle}</p>
        </DialogHeader>

        {loading && hasConfigurableRules ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Yükleniyor...
          </div>
        ) : (
          <div className="space-y-5">
            {isDeliveryCompleted && (
              <p className="text-xs text-muted-foreground rounded-md border bg-muted/40 px-3 py-2">
                Kesimhaneden teslim alacaklar ve kesimhane dışında teslim alacaklar için mesaj
                metinlerini şablon düzenleme ekranındaki iki ayrı kutuda yazın.
              </p>
            )}

            {/* Kesim aşaması offset: N numara ötesine gönder */}
            {isOffsetEvent && (
              <div className="space-y-2">
                <Label htmlFor="target_offset">
                  Kesilen kurbanın kaç numara sonrasına SMS gitsin?
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="target_offset"
                    type="number"
                    min={1}
                    max={50}
                    className="w-24"
                    value={form.target_offset ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        target_offset: e.target.value
                          ? Math.min(50, Math.max(1, parseInt(e.target.value, 10)))
                          : null,
                      }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    (işaretlenen no + bu sayı = SMS gidecek kurban no)
                  </span>
                </div>
                {offsetLiveExample && (
                  <p className="text-xs font-medium text-foreground/80 rounded-md bg-muted/60 px-2 py-1.5">
                    {offsetLiveExample}
                  </p>
                )}
              </div>
            )}

            {/* Parçalama / Teslim Almaya Çağrı: bekleme süresi katsayısı */}
            {isButcherMultiplierEvent && (
              <div className="space-y-2">
                <Label htmlFor="butcher_multiplier">
                  Bekleme süresi katsayısı
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="butcher_multiplier"
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    className="w-24"
                    value={form.target_offset ?? 1}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        target_offset: e.target.value
                          ? Math.min(10, Math.max(0.1, parseFloat(e.target.value)))
                          : 1,
                      }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    (ortalama bekleme × katsayı = şablondaki tahmini süre)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground rounded-md bg-muted/40 px-2 py-1.5">
                  Varsayılan 1 = geçmiş verilere dayalı ortalama süreyi kullan.
                  Biraz daha uzun tahmin için 1.2–1.5 gibi bir değer verin.
                </p>
              </div>
            )}

            {hasConfigurableRules && allowedScopes && (
              <div className="space-y-2">
                <Label>Alıcı kapsamı</Label>
                <Select
                  value={form.recipient_scope}
                  onValueChange={(v) => setForm((f) => ({ ...f, recipient_scope: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedScopes.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {eventKey === "slaughter_completed" && (
                  <p className="text-xs text-muted-foreground">
                    Kesimi tamamlanan kurban numarasının hissedarlarına gider; organizasyondaki
                    diğer kurbanların hissedarlarına gitmez.
                  </p>
                )}
              </div>
            )}

            {hasConfigurableRules && lockedScope && (
              <div className="space-y-2">
                <Label>Alıcı kapsamı</Label>
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/50">
                  <span className="text-sm">
                    {SCOPE_DISPLAY_LABELS[lockedScope] ?? lockedScope}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    (bu SMS için değiştirilemez)
                  </span>
                </div>
              </div>
            )}

            {isOffsetEvent && (
              <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                <p className="text-xs font-medium text-foreground">Sabit kurallar</p>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                  <li>{SMS_OFFSET_EVENT_FIXED_RULES_NOTES.missing}</li>
                  <li>{SMS_OFFSET_EVENT_FIXED_RULES_NOTES.completedSlaughter}</li>
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Bu otomatik SMS aktif</p>
                <p className="text-xs text-muted-foreground">
                  Kapalıysa mesaj gönderilmez; şablon ve geçmiş korunur.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs ${isTemplateActive ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {isTemplateActive ? "Açık" : "Kapalı"}
                </span>
                <Switch
                  checked={isTemplateActive}
                  disabled={toggleSaving}
                  onCheckedChange={() => void handleToggleActive()}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving || (loading && hasConfigurableRules)}
          >
            {isPaymentEvent || isDeliveryCompleted || !hasConfigurableRules ? "Kapat" : "İptal"}
          </Button>
          {hasConfigurableRules && (
            <Button
              onClick={() => void handleSave()}
              disabled={saving || loading}
              className="admin-tenant-accent"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
