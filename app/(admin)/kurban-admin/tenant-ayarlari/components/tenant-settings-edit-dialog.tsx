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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_AGREEMENT_COPY, DEFAULT_BRANDING } from "@/lib/tenant-branding-defaults";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { TenantSettingRow } from "./columns";

export type HomepageMode =
  | "bana_haber_ver"
  | "geri_sayim"
  | "live"
  | "tesekkur"
  | "follow_up"
  | "anasayfa"
  | "takip";

interface TenantSettingsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: TenantSettingRow | null;
  onSuccess: () => void;
}

export function TenantSettingsEditDialog({
  open,
  onOpenChange,
  row,
  onSuccess,
}: TenantSettingsEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (row) {
      const terms = row.agreement_terms;
      const termsJson = Array.isArray(terms) && terms.length > 0
        ? JSON.stringify(terms, null, 2)
        : "[]";
      setForm({
        theme_json: JSON.stringify(row.theme_json ?? {}, null, 2),
        homepage_mode: row.homepage_mode ?? "bana_haber_ver",
        logo_slug: row.logo_slug ?? "",
        iban: row.iban ?? "",
        website_url: row.website_url ?? "",
        contact_phone: row.contact_phone ?? "",
        contact_email: row.contact_email ?? "",
        contact_address: row.contact_address ?? "",
        active_sacrifice_year: row.active_sacrifice_year ?? 2025,
        deposit_amount: row.deposit_amount ?? DEFAULT_BRANDING.deposit_amount,
        deposit_deadline_days: row.deposit_deadline_days ?? 3,
        full_payment_deadline_month: row.full_payment_deadline_month ?? 5,
        full_payment_deadline_day: row.full_payment_deadline_day ?? 20,
        agreement_dialog_title:
          row.agreement_dialog_title ?? DEFAULT_AGREEMENT_COPY.agreement_dialog_title,
        agreement_main_heading:
          row.agreement_main_heading ?? DEFAULT_AGREEMENT_COPY.agreement_main_heading,
        agreement_intro_text:
          row.agreement_intro_text ?? DEFAULT_AGREEMENT_COPY.agreement_intro_text,
        agreement_footer_text:
          row.agreement_footer_text ?? DEFAULT_AGREEMENT_COPY.agreement_footer_text,
        agreement_notice_after_term_title: row.agreement_notice_after_term_title ?? "",
        agreement_notice_after_term_body: row.agreement_notice_after_term_body ?? "",
        agreement_terms: termsJson,
      });
    }
  }, [row]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!row) return;

    setLoading(true);
    try {
      let themeJson: Record<string, unknown> = {};
      try {
        themeJson = JSON.parse(String(form.theme_json || "{}"));
      } catch {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "theme_json geçerli bir JSON olmalıdır.",
        });
        setLoading(false);
        return;
      }

      let agreementTerms: { title: string; description: string }[] = [];
      try {
        const raw = JSON.parse(String(form.agreement_terms ?? "[]"));
        agreementTerms = Array.isArray(raw)
          ? raw.filter((t: unknown) => t && typeof t === "object" && "title" in t && "description" in t) as { title: string; description: string }[]
          : [];
      } catch {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Sözleşme maddeleri geçerli bir JSON dizisi olmalıdır.",
        });
        setLoading(false);
        return;
      }

      const strOrNull = (v: unknown) => {
        const s = String(v ?? "").trim();
        return s === "" ? null : s;
      };

      const body = {
        theme_json: themeJson,
        homepage_mode: form.homepage_mode,
        logo_slug: form.logo_slug || null,
        iban: form.iban || null,
        website_url: form.website_url || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        contact_address: form.contact_address || null,
        active_sacrifice_year: Number(form.active_sacrifice_year) || null,
        deposit_amount: Number(form.deposit_amount) || null,
        deposit_deadline_days: Number(form.deposit_deadline_days) || null,
        full_payment_deadline_month: Number(form.full_payment_deadline_month) || null,
        full_payment_deadline_day: Number(form.full_payment_deadline_day) || null,
        agreement_terms: agreementTerms,
        agreement_dialog_title: strOrNull(form.agreement_dialog_title),
        agreement_main_heading: strOrNull(form.agreement_main_heading),
        agreement_intro_text: strOrNull(form.agreement_intro_text),
        agreement_footer_text: strOrNull(form.agreement_footer_text),
        agreement_notice_after_term_title: strOrNull(form.agreement_notice_after_term_title),
        agreement_notice_after_term_body: strOrNull(form.agreement_notice_after_term_body),
      };

      const res = await fetch(`/api/admin/tenant-settings/${row.tenant_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Güncelleme başarısız");
      }

      toast({
        title: "Başarılı",
        description: "Tenant ayarları güncellendi.",
      });
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
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0"
        style={{ maxHeight: "90vh" }}
      >
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Organizasyon Ayarlarını Düzenle — {tenantName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homepage_mode">Anasayfa Modu</Label>
                  <Select
                    value={String(form.homepage_mode)}
                    onValueChange={(v) => setForm((f) => ({ ...f, homepage_mode: v }))}
                  >
                    <SelectTrigger id="homepage_mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bana_haber_ver">Ön Bilgilendirme / Bana Haber Ver</SelectItem>
                      <SelectItem value="geri_sayim">Yakında Açılıyor (geri sayım)</SelectItem>
                      <SelectItem value="live">Satış Aktif</SelectItem>
                      <SelectItem value="tesekkur">Teşekkür</SelectItem>
                      <SelectItem value="follow_up">Takip / Kesim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_slug">Logo Slug</Label>
                <Input
                  id="logo_slug"
                  value={String(form.logo_slug ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, logo_slug: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Textarea
                  id="iban"
                  rows={3}
                  value={String(form.iban ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
                  placeholder="Kapora için IBAN bilgisi..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={String(form.website_url ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">İletişim Telefonu</Label>
                  <Input
                    id="contact_phone"
                    value={String(form.contact_phone ?? "")}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contact_phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">İletişim E-posta</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={String(form.contact_email ?? "")}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contact_email: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_address">İletişim Adresi</Label>
                <Textarea
                  id="contact_address"
                  rows={3}
                  value={String(form.contact_address ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contact_address: e.target.value }))
                  }
                  placeholder="Adres bilgisi..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="active_sacrifice_year">Aktif Kurban Yılı</Label>
                  <Input
                    id="active_sacrifice_year"
                    type="number"
                    value={String(form.active_sacrifice_year ?? "")}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        active_sacrifice_year: e.target.value ? Number(e.target.value) : "",
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit_amount">Kapora Tutarı (₺)</Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    value={String(form.deposit_amount ?? "")}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        deposit_amount: e.target.value ? Number(e.target.value) : "",
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit_deadline_days">Kapora Son Gün (gün)</Label>
                  <Input
                    id="deposit_deadline_days"
                    type="number"
                    value={String(form.deposit_deadline_days ?? "")}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        deposit_deadline_days: e.target.value
                          ? Number(e.target.value)
                          : "",
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_payment_deadline_month">Tam Ödeme Ay</Label>
                  <Input
                    id="full_payment_deadline_month"
                    type="number"
                    value={String(form.full_payment_deadline_month ?? "")}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        full_payment_deadline_month: e.target.value
                          ? Number(e.target.value)
                          : "",
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_payment_deadline_day">Tam Ödeme Gün</Label>
                  <Input
                    id="full_payment_deadline_day"
                    type="number"
                    value={String(form.full_payment_deadline_day ?? "")}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        full_payment_deadline_day: e.target.value
                          ? Number(e.target.value)
                          : "",
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreement_dialog_title">Bilgi notu — diyalog başlığı</Label>
                <Input
                  id="agreement_dialog_title"
                  value={String(form.agreement_dialog_title ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agreement_dialog_title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreement_main_heading">Bilgi notu — ana başlık</Label>
                <Input
                  id="agreement_main_heading"
                  value={String(form.agreement_main_heading ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agreement_main_heading: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreement_intro_text">Giriş metni</Label>
                <Textarea
                  id="agreement_intro_text"
                  rows={5}
                  value={String(form.agreement_intro_text ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agreement_intro_text: e.target.value }))
                  }
                  placeholder="Paragraflar arasında boş satır bırakın. {{deposit_amount}} vb. kullanılabilir."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreement_footer_text">Alt not metni</Label>
                <Textarea
                  id="agreement_footer_text"
                  rows={5}
                  value={String(form.agreement_footer_text ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agreement_footer_text: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreement_notice_after_term_title">
                  Ek uyarı — hangi madde başlığından sonra?
                </Label>
                <Input
                  id="agreement_notice_after_term_title"
                  value={String(form.agreement_notice_after_term_title ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      agreement_notice_after_term_title: e.target.value,
                    }))
                  }
                  placeholder='Örn: Bilgilendirme ve Takip — JSON’daki title ile aynı olmalı'
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreement_notice_after_term_body">Ek uyarı metni</Label>
                <Textarea
                  id="agreement_notice_after_term_body"
                  rows={3}
                  value={String(form.agreement_notice_after_term_body ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      agreement_notice_after_term_body: e.target.value,
                    }))
                  }
                  placeholder="Boş bırakılırsa ek uyarı gösterilmez. {{deposit_amount}} vb. kullanılabilir."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreement_terms">Sözleşme Maddeleri (JSON)</Label>
                <Textarea
                  id="agreement_terms"
                  rows={12}
                  className="font-mono text-sm"
                  value={String(form.agreement_terms ?? "[]")}
                  onChange={(e) => setForm((f) => ({ ...f, agreement_terms: e.target.value }))}
                  placeholder='[{"title": "...", "description": "..."}]'
                />
                <p className="text-xs text-muted-foreground">
                  Her madde: title ve description. Tutar/tarih için {"{{deposit_amount}}"}, {"{{deposit_deadline_days}}"}, {"{{full_payment_deadline_day}}"}, {"{{full_payment_month_name}}"} kullanılabilir.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme_json">Tema JSON</Label>
                <Textarea
                  id="theme_json"
                  rows={8}
                  className="font-mono text-sm"
                  value={String(form.theme_json ?? "{}")}
                  onChange={(e) => setForm((f) => ({ ...f, theme_json: e.target.value }))}
                  placeholder='{"--primary": "#..."}'
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
