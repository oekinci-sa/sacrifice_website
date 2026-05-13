"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { differenceInDays } from "date-fns";
import { CalendarClock, SendIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { SmsEditor } from "../components/sms-editor";
import { SmsPreviewDialog, type SmsPreviewStats } from "../components/sms-preview-dialog";

interface SmsDraft {
  id: string;
  title: string;
  message_content: string;
  status: string;
  total_recipients: number;
  created_by: string;
  created_at: string;
}

export default function KayitliTopluGonderimleriPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [drafts, setDrafts] = useState<SmsDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sacrificeNo, setSacrificeNo] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [previewStats, setPreviewStats] = useState<SmsPreviewStats | null>(null);

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sms/sends?status=draft");
      const data = await res.json();
      setDrafts(data.sends ?? []);
    } catch {
      toast({ title: "Yüklenemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  const handleSaveDraft = async () => {
    if (!title.trim() || !messageContent.trim()) {
      toast({ title: "Başlık ve mesaj zorunlu", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message_content: messageContent,
          recipients: [{ phone_number: "dummy", recipient_name: "draft" }],
          sacrifice_year: selectedYear,
          target_type: sacrificeNo ? "after_sacrifice_no" : "custom",
          target_params: sacrificeNo ? { after_sacrifice_no: parseInt(sacrificeNo, 10) } : null,
          idempotency_key: uuidv4(),
          deduplicate_phone_numbers: true,
          _save_as_draft: true,
        }),
      });

      // Alternatif: direkt sms_sends tablosuna draft status olarak insert
      // Şimdilik POST /api/admin/sms/send endpoint'ini status=draft modifiyesiyle destekleyin
      // TODO: dedicated /api/admin/sms/drafts endpoint eklenebilir
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Kayıt başarısız", description: data.error, variant: "destructive" });
        return;
      }

      toast({ title: "Taslak kaydedildi" });
      setCreateOpen(false);
      setTitle("");
      setMessageContent("");
      setSacrificeNo("");
      loadDrafts();
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendDraft = (draft: SmsDraft) => {
    const daysSinceCreation = differenceInDays(new Date(), new Date(draft.created_at));
    setPreviewStats({
      totalRecipients: draft.total_recipients,
      validPhones: draft.total_recipients,
      duplicates: 0,
      invalidPhones: 0,
      willSend: draft.total_recipients,
      emptyVariableWarnings:
        daysSinceCreation > 2
          ? [`Bu toplu gönderim ${daysSinceCreation} gün önce oluşturuldu. Alıcı listesi güncel olmayabilir.`]
          : [],
      messageContent: draft.message_content,
      deduplicateEnabled: true,
    });
    setActiveDraftId(draft.id);
    setPreviewOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!activeDraftId) return;
    setIsSending(true);
    try {
      // Mevcut draft'ı gönder (status güncelleme + Bizim SMS API)
      // TODO: POST /api/admin/sms/sends/[id]/send endpoint
      toast({
        title: "Gönderim başlatıldı",
        description: "Bu özellik yakında tamamlanacak.",
      });
      setPreviewOpen(false);
    } finally {
      setIsSending(false);
    }
  };

  const daysSince = (d: string) => differenceInDays(new Date(), new Date(d));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kayıtlı Toplu Gönderimler</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hazırlayıp kaydettiğiniz toplu SMS gönderimlerini yönetin.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="admin-tenant-accent">
          <CalendarClock className="h-4 w-4 mr-2" />
          Yeni Hazırla
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Henüz kayıtlı toplu gönderim yok.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((d) => {
            const age = daysSince(d.created_at);
            return (
              <Card key={d.id} className="shadow-none rounded-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">{d.title}</CardTitle>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="outline">Taslak</Badge>
                    {age > 2 && (
                      <Badge variant="secondary" className="text-amber-600 border-amber-500">
                        {age} gün önce oluşturuldu
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-normal leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                    {d.message_content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Alıcı: {d.total_recipients} · {d.created_by}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="admin-tenant-accent w-full"
                    size="sm"
                    onClick={() => handleSendDraft(d)}
                  >
                    <SendIcon className="h-4 w-4 mr-2" />
                    Gönder
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Yeni Taslak Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Toplu Gönderim Hazırla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kurbanlık 36 sonrası kapora hatırlatma..."
              />
            </div>
            <div className="space-y-2">
              <Label>Kurbanlık no sonrası (opsiyonel)</Label>
              <Input
                type="number"
                value={sacrificeNo}
                onChange={(e) => setSacrificeNo(e.target.value)}
                placeholder="36"
              />
            </div>
            <SmsEditor value={messageContent} onChange={setMessageContent} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSaveDraft} disabled={saving} className="admin-tenant-accent">
              {saving ? "Kaydediliyor..." : "Taslak Olarak Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewStats && (
        <SmsPreviewDialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          onConfirm={handleConfirmSend}
          stats={previewStats}
          isLoading={isSending}
        />
      )}
    </div>
  );
}
