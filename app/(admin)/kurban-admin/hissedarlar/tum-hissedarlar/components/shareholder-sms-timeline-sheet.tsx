"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/use-toast";
import { SmsEditor } from "../../../sms-islemleri/components/sms-editor";
import { shortenSmsSendDisplayTitle } from "@/lib/sms-send-title-display";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { isValidPhone } from "@/lib/sms-phone-normalizer";
import type { shareholderSchema } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface HistoryItem {
  id: string;
  send_id: string | null;
  send_title: string | null;
  personalized_message: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

interface SmsTemplateBrief {
  id: string;
  title: string;
  content: string;
}

interface Props {
  shareholder: shareholderSchema | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareholderSmsTimelineSheet({ shareholder, open, onOpenChange }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<SmsTemplateBrief[]>([]);
  const [sendMessage, setSendMessage] = useState("");
  const [templateChoice, setTemplateChoice] = useState<string>("manual");
  const [sending, setSending] = useState(false);

  const textareaId = shareholder
    ? `shareholder-sms-send-editor-${shareholder.shareholder_id}`
    : "shareholder-sms-send-editor";

  const loadHistory = useCallback(() => {
    if (!shareholder) return;
    setLoading(true);
    fetch(`/api/admin/sms/shareholder-history?shareholderId=${shareholder.shareholder_id}`)
      .then((r) => r.json())
      .then((d) =>
        setItems(
          Array.isArray(d.history)
            ? (d.history as HistoryItem[]).filter((h) => h.status !== "skipped")
            : []
        )
      )
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [shareholder]);

  useEffect(() => {
    if (!open || !shareholder) {
      setItems([]);
      return;
    }
    loadHistory();
  }, [open, shareholder, loadHistory]);

  useEffect(() => {
    if (!sendDialogOpen) return;
    fetch("/api/admin/sms/templates?active=true")
      .then((r) => r.json())
      .then((d) => setTemplates(((d.templates ?? []) as SmsTemplateBrief[]) ?? []))
      .catch(() => setTemplates([]));
  }, [sendDialogOpen]);

  useEffect(() => {
    if (!sendDialogOpen) return;
    if (templateChoice === "manual") return;
    const tpl = templates.find((t) => t.id === templateChoice);
    if (tpl) setSendMessage(tpl.content);
  }, [templateChoice, templates, sendDialogOpen]);

  const handleOpenSendDialog = () => {
    setTemplateChoice("manual");
    setSendMessage("");
    setSendDialogOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!shareholder?.shareholder_id) return;
    const msg = sendMessage.trim();
    if (!msg) {
      toast({ title: "Mesaj boş olamaz", variant: "destructive" });
      return;
    }
    const phone = shareholder.phone_number?.trim() ?? "";
    if (!isValidPhone(phone)) {
      toast({
        title: "Geçersiz telefon",
        description: "Bu hissedarın kayıtlı bir telefonu yok.",
        variant: "destructive",
      });
      return;
    }

    const idempotency_key = uuidv4();
    setSending(true);
    try {
      const res = await fetch("/api/admin/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Tekil SMS — ${shareholder.shareholder_name}`,
          message_content: msg,
          recipients: [
            {
              shareholder_id: shareholder.shareholder_id,
              sacrifice_id: shareholder.sacrifice_id,
              recipient_name: shareholder.shareholder_name,
              phone_number: phone.replace(/\s/g, ""),
            },
          ],
          sacrifice_year: shareholder.sacrifice_year,
          target_type: "single_phone",
          target_params: null,
          deduplicate_phone_numbers: true,
          idempotency_key,
        }),
      });
      const data = await res.json();
      setSendDialogOpen(false);
      if (res.ok && data.ok) {
        toast({
          title: "SMS gönderildi",
          description:
            `${data.sent ?? 1} ileti operatöre iletildi.` +
            (data.warnings?.length ? ` ⚠️ ${data.warnings[0]}` : ""),
        });
        loadHistory();
      } else {
        toast({
          title: "Gönderim başarısız",
          description: data.error ?? "Bilinmeyen hata",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-6 overflow-hidden gap-0">
          <SheetHeader className="shrink-0 text-left space-y-1 pb-4">
            <SheetTitle>SMS geçmişi</SheetTitle>
            <SheetDescription>
              {shareholder?.shareholder_name ?? "—"}
              {shareholder?.sacrifice?.sacrifice_no != null
                ? ` · Kurban no ${shareholder.sacrifice.sacrifice_no}`
                : ""}
              {shareholder?.phone_number
                ? ` · ${formatPhoneForDisplayWithSpacing(shareholder.phone_number)}`
                : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="border-b shrink-0 pb-3 mb-4">
            <Button
              type="button"
              className="admin-tenant-accent w-full sm:w-auto"
              size="sm"
              disabled={!shareholder}
              onClick={handleOpenSendDialog}
            >
              Yeni SMS gönder
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Yükleniyor…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Bu hissedar için gösterilecek SMS kaydı yok.
              </p>
            ) : (
              <div className="relative border-l border-border pl-5 space-y-8 pb-4">
                {items.map((entry) => {
                  const dt = entry.sent_at ?? entry.created_at;
                  const when = dt ? new Date(dt).toLocaleString("tr-TR") : "—";
                  return (
                    <div key={entry.id} className="relative">
                      <span
                        className="absolute -left-[21px] top-1.5 flex h-2.5 w-2.5 rounded-full border-2 border-background bg-primary"
                        aria-hidden
                      />
                      <p className="text-xs text-muted-foreground">{when}</p>
                      <p className="text-sm font-semibold leading-snug mt-0.5">
                        {shortenSmsSendDisplayTitle(entry.send_title)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap break-words">
                        {(entry.personalized_message ?? "").trim() || "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={sendDialogOpen}
        onOpenChange={(v) => {
          setSendDialogOpen(v);
          if (!v) {
            setSendMessage("");
            setTemplateChoice("manual");
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni SMS gönder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sh-sms-template-pick">Şablondan</Label>
              <Select
                value={templateChoice}
                onValueChange={(v) => {
                  setTemplateChoice(v);
                }}
              >
                <SelectTrigger id="sh-sms-template-pick">
                  <SelectValue placeholder="Şablon veya elle…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Elle yazacağım</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <SmsEditor
              value={sendMessage}
              onChange={setSendMessage}
              label="Mesaj"
              textareaId={textareaId}
              disabled={sending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)} disabled={sending}>
              İptal
            </Button>
            <Button
              className="admin-tenant-accent"
              onClick={() => void handleConfirmSend()}
              disabled={sending || !sendMessage.trim()}
            >
              {sending ? "Gönderiliyor…" : "Gönder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
