"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { adminPrimaryCtaClassName } from "@/lib/admin-tenant-accent";
import { normalizeEmail } from "@/lib/email-utils";
import { buildMailRecipientRows, type MailRecipientRow } from "@/lib/mail-recipient-rows";
import { htmlToPlainTextForEmail } from "@/lib/mail-rich-text";
import {
  DISPLAY_ANKARA,
  DISPLAY_ANKARA_ILETISIM,
  DISPLAY_ELYA,
  DISPLAY_ELYA_ILETISIM,
  getAdminMailboxLabelsForLogoSlug,
  type AdminMailSenderKind,
} from "@/lib/resend-mail-config";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { cn } from "@/lib/utils";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { ChevronDown, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createMailRecipientColumns } from "./components/columns";
import {
  MailRecipientsToolbar,
  SourceFilter,
} from "./components/mail-recipients-toolbar";
import {
  MAIL_EDITOR_DEFAULT_HTML,
  MailRichEditor,
} from "./components/mail-rich-editor";

type PanelUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  status: string | null;
  role: string | null;
  tenant_approved_at: string | null;
};

type ShareholderContactRow = {
  email: string;
  shareholder_name: string;
  sacrifice_year: number;
};

type ReminderContactRow = {
  id: string;
  name: string;
  phone: string;
  sacrifice_year: number;
  email: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Radix Avatar varsayılan bg-muted ile dışarıda gri görünmesin; dialog ile aynı primary vurgusu */
const recipientInitialClassName =
  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/25";

export default function MailIslemleriPage() {
  const { toast } = useToast();
  const { logo_slug } = useTenantBranding();
  const selectedYear = useAdminYearStore((s) => s.selectedYear);

  const [panelUsers, setPanelUsers] = useState<PanelUserRow[]>([]);
  const [shareholderContacts, setShareholderContacts] = useState<ShareholderContactRow[]>([]);
  const [reminderContacts, setReminderContacts] = useState<ReminderContactRow[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [subject, setSubject] = useState("");
  const [messageHtml, setMessageHtml] = useState(MAIL_EDITOR_DEFAULT_HTML);
  /** Önceki davranış (yalnızca iletisim@) ile uyumlu varsayılan */
  const [senderKind, setSenderKind] = useState<AdminMailSenderKind>("iletisim");

  /** Normalize edilmiş e-posta adresleri (tablo + liste dışı eklenenler) */
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [pending, setPending] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [kimeOpen, setKimeOpen] = useState(false);
  const [manualEmailInput, setManualEmailInput] = useState("");

  const fetchLists = useCallback(async () => {
    if (selectedYear == null) return;
    setListLoading(true);
    try {
      const res = await fetch(`/api/admin/email-recipients?year=${selectedYear}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Liste alınamadı");
      }
      setPanelUsers(data.panelUsers ?? []);
      setShareholderContacts(data.shareholderContacts ?? []);
      setReminderContacts(data.reminderContacts ?? []);
      setSelected(new Set());
    } catch (e) {
      setPanelUsers([]);
      setShareholderContacts([]);
      setReminderContacts([]);
      toast({
        title: "Liste yüklenemedi",
        description: e instanceof Error ? e.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setListLoading(false);
    }
  }, [selectedYear, toast]);

  useEffect(() => {
    void fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (!kimeOpen) return;
    const id = window.requestAnimationFrame(() => {
      document.getElementById("kime-dialog-email-input")?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [kimeOpen]);

  const tableRows = useMemo(
    () =>
      buildMailRecipientRows(panelUsers, shareholderContacts, reminderContacts).filter(
        (r) => r.canSend && Boolean(r.normalizedEmail)
      ),
    [panelUsers, shareholderContacts, reminderContacts]
  );

  const rowByEmail = useMemo(() => {
    const m = new Map<string, MailRecipientRow>();
    for (const r of tableRows) {
      if (r.normalizedEmail) m.set(r.normalizedEmail, r);
    }
    return m;
  }, [tableRows]);

  const sortedSelectedEmails = useMemo(
    () => Array.from(selected).sort((a, b) => a.localeCompare(b, "tr")),
    [selected]
  );

  const filteredRows = useMemo(() => {
    let rows = tableRows;
    if (sourceFilter !== "all") {
      rows = rows.filter((r) => r.sources.includes(sourceFilter));
    }
    const q = normalizeTurkishSearchText(searchTerm.trim());
    if (q) {
      rows = rows.filter((r) => {
        const kaynakBlob = normalizeTurkishSearchText(
          `${r.kaynakKisa} ${r.kaynakParcalari.join(" ")}`
        );
        return (
          normalizeTurkishSearchText(r.mailSahibi).includes(q) ||
          normalizeTurkishSearchText(r.mailAdresi).includes(q) ||
          kaynakBlob.includes(q)
        );
      });
    }
    return rows;
  }, [tableRows, sourceFilter, searchTerm]);

  const toggleEmail = useCallback((raw: string) => {
    const key = normalizeEmail(raw);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const removeRecipient = useCallback((norm: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(norm);
      return next;
    });
  }, []);

  const addManualEmail = useCallback(() => {
    const trimmed = manualEmailInput.trim();
    if (!trimmed) return;
    if (!EMAIL_RE.test(trimmed)) {
      toast({
        title: "Geçersiz e-posta",
        description: "Geçerli bir e-posta adresi girin.",
        variant: "destructive",
      });
      return;
    }
    const key = normalizeEmail(trimmed);
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setManualEmailInput("");
  }, [manualEmailInput, toast]);

  const columns = useMemo(
    () => createMailRecipientColumns(selected, toggleEmail),
    [selected, toggleEmail]
  );

  const mailboxLabels = useMemo(
    () => getAdminMailboxLabelsForLogoSlug(logo_slug),
    [logo_slug]
  );

  const adminFromDisplayPreview = useMemo(() => {
    const isElya = logo_slug === "elya-hayvancilik";
    if (senderKind === "iletisim") {
      return isElya ? DISPLAY_ELYA_ILETISIM : DISPLAY_ANKARA_ILETISIM;
    }
    return isElya ? DISPLAY_ELYA : DISPLAY_ANKARA;
  }, [logo_slug, senderKind]);

  const selectAllFiltered = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of filteredRows) {
        if (r.canSend && r.normalizedEmail) next.add(r.normalizedEmail);
      }
      return next;
    });
  }, [filteredRows]);

  const clearSelection = () => setSelected(new Set());

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedYear == null) {
      toast({
        title: "Yıl seçin",
        description: "Üst menüden kurban yılını seçin.",
        variant: "destructive",
      });
      return;
    }
    const recipients = Array.from(selected);
    if (recipients.length === 0) {
      toast({
        title: "Alıcı yok",
        description: "En az bir e-posta seçin, ekleyin veya listeden işaretleyin.",
        variant: "destructive",
      });
      return;
    }

    if (!htmlToPlainTextForEmail(messageHtml).trim()) {
      toast({
        title: "Mesaj boş",
        description: "Mesaj alanına metin yazın.",
        variant: "destructive",
      });
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: messageHtml,
          recipients,
          sacrificeYear: selectedYear,
          senderKind,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Gönderilemedi",
          description:
            typeof data.error === "string" ? data.error : "İstek başarısız oldu.",
          variant: "destructive",
        });
        return;
      }
      const failed = typeof data.failed === "number" ? data.failed : 0;
      toast({
        title: "E-posta gönderildi",
        description:
          failed > 0
            ? `${data.sent ?? 0} gönderildi, ${failed} başarısız.`
            : `${data.sent ?? recipients.length} alıcıya gönderildi.`,
      });
    } catch {
      toast({
        title: "Hata",
        description: "Bağlantı hatası oluştu.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  if (selectedYear == null) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Mail İşlemleri</h1>
        <p className="text-muted-foreground">
          Liste ve gönderim için üst çubuktan kurban yılını seçin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full min-w-0">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Mail İşlemleri</h1>
        <p className="text-muted-foreground mt-2 max-w-[90%]">
          Gönderen kutusundan bilgi veya iletişim adresini seçin. Kime alanını açarak tablodan
          seçim yapın veya geçerli bir e-posta ekleyin. Resend anahtarı tenant’a göre sunucuda
          ayarlanır.
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mail-sender-kind" className="text-base font-semibold">
            Gönderen
          </Label>
          <Select
            value={senderKind}
            onValueChange={(v) => setSenderKind(v as AdminMailSenderKind)}
          >
            <SelectTrigger id="mail-sender-kind" className="w-full max-w-md">
              <SelectValue placeholder="Gönderen seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bilgi">
                Bilgi ({mailboxLabels.bilgi})
              </SelectItem>
              <SelectItem value="iletisim">
                İletişim ({mailboxLabels.iletisim})
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Alıcılar bu adresten «{adminFromDisplayPreview}» görünen adıyla görür.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kime-trigger" className="text-base font-semibold">
            Kime
          </Label>
          <Dialog open={kimeOpen} onOpenChange={setKimeOpen}>
            <div className="space-y-2">
              <div
                id="kime-trigger"
                role="button"
                tabIndex={0}
                onClick={() => setKimeOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setKimeOpen(true);
                  }
                }}
                className={cn(
                  "flex min-h-9 w-full cursor-pointer items-start gap-2 rounded-md border border-input bg-transparent px-2 py-1.5 text-left text-sm shadow-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                )}
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  {sortedSelectedEmails.length === 0 ? (
                    <span className="text-muted-foreground">
                      Alıcı seçmek veya eklemek için tıklayın…
                    </span>
                  ) : (
                    sortedSelectedEmails.map((norm) => {
                      const row = rowByEmail.get(norm);
                      const label =
                        row && row.mailSahibi && row.mailSahibi !== "—"
                          ? `${row.mailSahibi} (${row.mailAdresi})`
                          : row?.mailAdresi ?? norm;
                      const initialSource =
                        row?.mailSahibi && row.mailSahibi !== "—" ? row.mailSahibi : norm;
                      const initialChar = initialSource.charAt(0).toLocaleUpperCase("tr");
                      return (
                        <span
                          key={norm}
                          className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground"
                        >
                          <span className={recipientInitialClassName} aria-hidden>
                            {initialChar}
                          </span>
                          <span className="min-w-0 truncate" title={label}>
                            {label}
                          </span>
                          <button
                            type="button"
                            className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecipient(norm);
                            }}
                            aria-label="Alıcıyı kaldır"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 opacity-60 transition-transform",
                    kimeOpen && "rotate-180"
                  )}
                />
              </div>
            </div>
            <DialogContent
              overlayClassName="bg-black/50"
              className="max-h-[min(85vh,880px)] w-[min(100vw-2rem,960px)] max-w-[960px] gap-4 overflow-y-auto p-4 sm:p-6"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
              }}
            >
              <DialogHeader>
                <DialogTitle>Alıcı seç</DialogTitle>
                <DialogDescription>
                  Tablodan işaretleyin veya aşağıdaki Kime alanına e-posta yazıp Enter ile ekleyin.
                  Kayıtlar birleştirilir; e-postası olmayan hatırlatma satırları seçilemez.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="kime-dialog-email-input" className="text-sm font-medium">
                  Kime
                </Label>
                <div
                  className={cn(
                    "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 shadow-sm",
                    "focus-within:ring-1 focus-within:ring-ring"
                  )}
                >
                  {sortedSelectedEmails.map((norm) => {
                    const row = rowByEmail.get(norm);
                    const label =
                      row && row.mailSahibi && row.mailSahibi !== "—"
                        ? `${row.mailSahibi} (${row.mailAdresi})`
                        : row?.mailAdresi ?? norm;
                    const initialSource =
                      row?.mailSahibi && row.mailSahibi !== "—" ? row.mailSahibi : norm;
                    const initialChar = initialSource.charAt(0).toLocaleUpperCase("tr");
                    return (
                      <span
                        key={`dlg-${norm}`}
                        className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground"
                      >
                        <span className={recipientInitialClassName} aria-hidden>
                          {initialChar}
                        </span>
                        <span className="min-w-0 truncate" title={label}>
                          {label}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => removeRecipient(norm)}
                          aria-label="Alıcıyı kaldır"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    );
                  })}
                  <input
                    id="kime-dialog-email-input"
                    type="email"
                    autoComplete="email"
                    placeholder="E-posta yazıp Enter ile ekleyin…"
                    value={manualEmailInput}
                    onChange={(e) => setManualEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addManualEmail();
                      }
                    }}
                    className="min-h-8 min-w-[12rem] flex-1 border-0 bg-transparent px-0.5 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {listLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-9 w-96 max-w-full sm:w-[28rem]" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <CustomDataTable
                  columns={columns}
                  data={filteredRows}
                  storageKey="mail-islemleri-alicilar"
                  initialState={{ columnVisibility: {} }}
                  filters={({ table }) => (
                    <MailRecipientsToolbar
                      table={table}
                      columnFilters={table.getState().columnFilters}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      sourceFilter={sourceFilter}
                      setSourceFilter={setSourceFilter}
                      onSelectAllFiltered={selectAllFiltered}
                      onClearSelection={clearSelection}
                      listLoading={listLoading}
                    />
                  )}
                  tableSize="medium"
                  pageSizeOptions={[20, 50, 100, 200, 500]}
                />
              )}
              <DialogFooter className="gap-2 border-t pt-4 mt-2 sm:justify-end">
                <Button type="button" onClick={() => setKimeOpen(false)}>
                  Tamam
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-sm text-muted-foreground">
          Konu zorunludur. Mesaj alanında Enter ile yeni paragraf; araç çubuğu ile kalın, italik vb.
        </p>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Mesaj</h2>
          <div className="space-y-2">
            <Label htmlFor="subj">Konu</Label>
            <Input
              id="subj"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="E-posta konusu"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="msg-editor">Mesaj</Label>
            <div id="msg-editor">
              <MailRichEditor
                initialHtml={MAIL_EDITOR_DEFAULT_HTML}
                onChange={setMessageHtml}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              İpucu: Yeni paragraf için Enter. Biçimlendirme yalnızca üstteki düğmelerle veya
              kopyala-yapıştır ile eklenir; ham kod görünmez.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={pending}
              className={cn(adminPrimaryCtaClassName(logo_slug))}
            >
              {pending ? "Gönderiliyor…" : "Gönder"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
