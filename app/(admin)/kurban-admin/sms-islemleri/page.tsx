"use client";

import { Button } from "@/components/ui/button";
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
import { smsRecipientDedupKey } from "@/lib/sms-dedup";
import { isValidPhone, normalizePhone } from "@/lib/sms-phone-normalizer";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { SmsAdminSection } from "./components/sms-admin-section";
import { SmsEditor } from "./components/sms-editor";
import { SmsPreviewDialog, type SmsPreviewStats } from "./components/sms-preview-dialog";
import {
  SmsRecipientTable,
  recipientRowKey,
  type RecipientTableRow,
} from "./components/sms-recipient-table";
import {
  SmsSacrificePicker,
  type KurbanScope,
  type SacrificeOptionRow,
} from "./components/sms-sacrifice-picker";
import {
  SmsShareholderPicker,
  type ShareholderPickValue,
} from "./components/sms-shareholder-picker";

type TargetType =
  | "sacrifice_all"
  | "after_sacrifice_no"
  | "sacrifice_range"
  | "single_phone"
  | "shareholder_pick";

type DeliveryRecipientScope = "all" | "slaughterhouse" | "other";

type Recipient = RecipientTableRow;

interface SmsTemplate {
  id: string;
  title: string;
  content: string;
  event_key?: string | null;
}

const BULK_LOADING_TARGETS: TargetType[] = [
  "sacrifice_all",
  "sacrifice_range",
  "after_sacrifice_no",
];

/** Sunucunun döndürdüğü dışlanma kırılımıyla tamamlayıcı toast metni */
function formatSmsSentToastDescription(data: {
  sent: number;
  excluded?: number;
  excluded_invalid_phone?: number;
  excluded_duplicate_phone?: number;
  warnings?: string[];
}): string {
  const extras: string[] = [];
  extras.push(`${data.sent} ileti operatöre iletildi.`);
  const excluded = Number(data.excluded ?? 0);
  if (excluded > 0) {
    const inv =
      typeof data.excluded_invalid_phone === "number" ? data.excluded_invalid_phone : null;
    const dup =
      typeof data.excluded_duplicate_phone === "number"
        ? data.excluded_duplicate_phone
        : null;
    if (inv !== null && dup !== null) {
      extras.push(
        `Dışlanan: ${excluded} (${inv} geçersiz telefon, ${dup} mükerrer cep — aynı kurbanlıkta aynı numara; isim kullanılmaz.)`
      );
    } else {
      extras.push(`Dışlanan: ${excluded}.`);
    }
  }
  if (data.warnings?.length) {
    extras.push(`⚠️ ${data.warnings[0]}`);
  }
  return extras.join(" ");
}

function mapTargetTypeForApi(tt: TargetType): string {
  switch (tt) {
    case "sacrifice_range":
      return "sacrifice_range";
    case "after_sacrifice_no":
      return "after_sacrifice_no";
    case "single_phone":
      return "single_phone";
    case "shareholder_pick":
      return "shareholder_pick";
    default:
      return "sacrifice_all";
  }
}

/** Aynı kurban sıra numaraları kümesi ise `true` — gereksiz state güncellemesi yapılmamalı (refetch tetiklenmesin). */
function sameSortedNumberArray(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function recipientFromPick(p: ShareholderPickValue): Recipient {
  return {
    shareholder_id: p.shareholder_id,
    sacrifice_id: p.sacrifice_id,
    recipient_name: p.shareholder_name,
    phone_number: p.phone_number ?? "",
    sacrifice_no: p.sacrifice_no,
    has_valid_phone: isValidPhone(p.phone_number),
    include_in_send: true,
  };
}

export default function SmsGonderPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [targetType, setTargetType] = useState<TargetType>("sacrifice_all");
  const [kurbanScope, setKurbanScope] = useState<KurbanScope>("picked");
  const [pickedSacrificeNos, setPickedSacrificeNos] = useState<number[]>([]);
  const [afterSacrificeNo, setAfterSacrificeNo] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [singlePhone, setSinglePhone] = useState("");
  const [singleName, setSingleName] = useState("");
  const [pickedShareholders, setPickedShareholders] = useState<ShareholderPickValue[]>([]);
  const [messageContent, setMessageContent] = useState("");
  /** Toplu hedeflerde teslimat tercihine göre alıcı süzme */
  const [deliveryRecipientScope, setDeliveryRecipientScope] =
    useState<DeliveryRecipientScope>("all");
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [sacrificeOptions, setSacrificeOptions] = useState<SacrificeOptionRow[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewStats, setPreviewStats] = useState<SmsPreviewStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/sms/templates?active=true")
      .then((r) => r.json())
      .then((d) => {
        const all = (d.templates ?? []) as SmsTemplate[];
        setTemplates(all.filter((t) => !t.event_key));
      })
      .catch(() => { });
  }, []);

  const loadSacrificeOptions = useCallback(async () => {
    if (!selectedYear) {
      setSacrificeOptions([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/sms/sacrifice-options?year=${selectedYear}`
      );
      const data = await res.json();
      if (res.ok) setSacrificeOptions(data.options ?? []);
    } catch {
      setSacrificeOptions([]);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadSacrificeOptions();
  }, [loadSacrificeOptions]);

  const loadRecipients = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!selectedYear) {
        setRecipients([]);
        if (!silent) {
          toast({
            title: "Yıl seçilmedi",
            description: "Lütfen yıl seçin.",
            variant: "destructive",
          });
        }
        return;
      }
      if (targetType === "single_phone" || targetType === "shareholder_pick") {
        return;
      }

      if (targetType === "after_sacrifice_no") {
        if (!afterSacrificeNo.trim()) {
          setRecipients([]);
          return;
        }
      }

      if (targetType === "sacrifice_range") {
        const fromN = parseInt(rangeFrom, 10);
        const toN = parseInt(rangeTo, 10);
        if (!Number.isFinite(fromN) || !Number.isFinite(toN)) {
          setRecipients([]);
          return;
        }
        if (fromN > toN) {
          setRecipients([]);
          if (!silent) {
            toast({
              title: "Geçersiz aralık",
              description: "Başlangıç, bitişten büyük olamaz.",
              variant: "destructive",
            });
          }
          return;
        }
      }

      if (targetType === "sacrifice_all" && kurbanScope === "picked") {
        if (pickedSacrificeNos.length === 0) {
          setRecipients([]);
          return;
        }
      }

      setLoadingRecipients(true);
      try {
        const params = new URLSearchParams({ year: String(selectedYear) });

        if (targetType === "sacrifice_all" && kurbanScope === "picked") {
          params.set(
            "sacrificeNos",
            pickedSacrificeNos.slice().sort((a, b) => a - b).join(",")
          );
        }
        if (targetType === "after_sacrifice_no" && afterSacrificeNo.trim()) {
          params.set("afterSacrificeNo", afterSacrificeNo.trim());
        }
        if (targetType === "sacrifice_range") {
          params.set("sacrificeNoFrom", rangeFrom.trim());
          params.set("sacrificeNoTo", rangeTo.trim());
        }
        if (deliveryRecipientScope !== "all") {
          params.set("deliveryFilter", deliveryRecipientScope);
        }

        const res = await fetch(`/api/admin/sms/recipients?${params}`);
        const data = await res.json();
        if (!res.ok) {
          toast({ title: "Hata", description: data.error, variant: "destructive" });
          setRecipients([]);
          return;
        }
        setRecipients(
          (data.recipients as Omit<Recipient, "include_in_send">[] | undefined)?.map(
            (r) => ({ ...r, include_in_send: true })
          ) ?? []
        );
        if (data.message) {
          toast({ title: "Bilgi", description: data.message });
        }
      } catch {
        toast({ title: "Bağlantı hatası", variant: "destructive" });
        setRecipients([]);
      } finally {
        setLoadingRecipients(false);
      }
    },
    [
      selectedYear,
      targetType,
      kurbanScope,
      pickedSacrificeNos,
      afterSacrificeNo,
      rangeFrom,
      rangeTo,
      deliveryRecipientScope,
    ]
  );

  useEffect(() => {
    if (!selectedYear) return;
    if (!BULK_LOADING_TARGETS.includes(targetType)) return;
    const id = window.setTimeout(() => {
      void loadRecipients({ silent: true });
    }, 450);
    return () => window.clearTimeout(id);
  }, [
    selectedYear,
    targetType,
    loadRecipients,
    kurbanScope,
    pickedSacrificeNos,
    afterSacrificeNo,
    rangeFrom,
    rangeTo,
    deliveryRecipientScope,
  ]);

  useEffect(() => {
    if (targetType !== "shareholder_pick") return;
    setRecipients((prev) => {
      const byKey = new Map(prev.map((r) => [recipientRowKey(r), r]));
      return pickedShareholders.map((p) => {
        const k = `${p.shareholder_id}:${p.sacrifice_id}`;
        const existing = byKey.get(k);
        if (existing) return existing;
        return { ...recipientFromPick(p), include_in_send: true };
      });
    });
  }, [targetType, pickedShareholders]);

  const buildPreviewStats = (): SmsPreviewStats => {
    let allRecipients: Recipient[];

    if (targetType === "single_phone") {
      allRecipients = [
        {
          phone_number: singlePhone,
          recipient_name: singleName,
          has_valid_phone: isValidPhone(singlePhone),
          include_in_send: true,
        },
      ];
    } else {
      allRecipients = recipients.filter((r) => r.include_in_send);
    }

    const validPhones = allRecipients.filter((r) => r.has_valid_phone);
    const invalidPhones = allRecipients.length - validPhones.length;

    const seen = new Set<string>();
    let duplicates = 0;
    const deduped = validPhones.filter((r) => {
      const norm = normalizePhone(r.phone_number);
      if (!norm) return true;
      const dk = smsRecipientDedupKey(
        norm,
        r.sacrifice_id,
        r.shareholder_id ?? null
      );
      if (seen.has(dk)) {
        duplicates++;
        return false;
      }
      seen.add(dk);
      return true;
    });

    const willSend = deduped.length;

    return {
      totalRecipients: allRecipients.length,
      validPhones: validPhones.length,
      duplicates,
      invalidPhones,
      willSend,
      emptyVariableWarnings: [],
      messageContent,
      deduplicateEnabled: true,
    };
  };

  const handlePreview = () => {
    if (!messageContent.trim()) {
      toast({ title: "Mesaj içeriği boş", variant: "destructive" });
      return;
    }
    if (targetType === "single_phone") {
      if (!singlePhone?.trim()) {
        toast({
          title: "Telefon gerekli",
          description: "Tekil gönderim için telefon numarası girin.",
          variant: "destructive",
        });
        return;
      }
    } else if (targetType === "shareholder_pick") {
      if (recipients.length === 0) {
        toast({
          title: "Alıcı yok",
          description: "Önce hissedar seçin.",
          variant: "destructive",
        });
        return;
      }
      const active = recipients.filter((r) => r.include_in_send);
      if (active.length === 0) {
        toast({
          title: "Alıcı seçilmedi",
          description: "Gönderim listesinde en az bir alıcı işaretli olsun.",
          variant: "destructive",
        });
        return;
      }
    } else if (BULK_LOADING_TARGETS.includes(targetType)) {
      if (recipients.length === 0) {
        toast({
          title: "Alıcı yok",
          description: "Filtreye uygun kayıt bulunamadı veya yükleniyor.",
          variant: "destructive",
        });
        return;
      }
      const active = recipients.filter((r) => r.include_in_send);
      if (active.length === 0) {
        toast({
          title: "Alıcı seçilmedi",
          description: "Listede gönderilecek en az bir alıcı bırakın.",
          variant: "destructive",
        });
        return;
      }
    }
    setPreviewStats(buildPreviewStats());
    setPreviewOpen(true);
  };

  const handleSend = async () => {
    if (!previewStats) return;
    setIsSending(true);

    let recipientList: Array<{
      shareholder_id?: string;
      sacrifice_id?: string;
      recipient_name?: string;
      phone_number: string;
    }>;

    if (targetType === "single_phone") {
      recipientList = [
        { phone_number: singlePhone, recipient_name: singleName || undefined },
      ];
    } else {
      recipientList = recipients
        .filter((r) => r.has_valid_phone && r.include_in_send)
        .map((r) => ({
          shareholder_id: r.shareholder_id,
          sacrifice_id: r.sacrifice_id,
          recipient_name: r.recipient_name,
          phone_number: r.phone_number,
        }));
    }

    const target_params: Record<string, unknown> = {};
    if (targetType === "sacrifice_all" && kurbanScope === "picked" && pickedSacrificeNos.length > 0) {
      target_params.filter_sacrifice_nos = pickedSacrificeNos.slice().sort((a, b) => a - b);
    }
    if (targetType === "after_sacrifice_no" && afterSacrificeNo) {
      target_params.after_sacrifice_no = parseInt(afterSacrificeNo, 10);
    }
    if (targetType === "sacrifice_range") {
      target_params.sacrifice_no_from = parseInt(rangeFrom, 10);
      target_params.sacrifice_no_to = parseInt(rangeTo, 10);
    }
    if (BULK_LOADING_TARGETS.includes(targetType) && deliveryRecipientScope !== "all") {
      target_params.delivery_recipient_scope = deliveryRecipientScope;
    }

    try {
      const res = await fetch("/api/admin/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `SMS Gönderimi — ${new Date().toLocaleString("tr-TR")}`,
          message_content: messageContent,
          recipients: recipientList,
          sacrifice_year: selectedYear,
          target_type: mapTargetTypeForApi(targetType),
          target_params: Object.keys(target_params).length ? target_params : null,
          deduplicate_phone_numbers: true,
          idempotency_key: uuidv4(),
        }),
      });

      const data = await res.json();
      setPreviewOpen(false);

      if (res.ok && data.ok) {
        toast({
          title: "SMS gönderildi",
          description: formatSmsSentToastDescription(data),
        });
        setMessageContent("");
        setRecipients([]);
        setPickedShareholders([]);
        setSinglePhone("");
        setSingleName("");
      } else {
        toast({
          title: "Gönderim başarısız",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const toggleRecipientInclude = (key: string, include: boolean) => {
    setRecipients((prev) =>
      prev.map((row) =>
        recipientRowKey(row) === key ? { ...row, include_in_send: include } : row
      )
    );
  };

  const commitRecipientListSave = () => {
    setRecipients((prev) => {
      const next = prev.filter((r) => r.include_in_send);
      const removed = prev.length - next.length;
      if (removed > 0) {
        toast({
          title: "Liste kaydedildi",
          description: `${removed} satır gönderim listesinden çıkarıldı.`,
        });
      }
      if (targetType === "sacrifice_all" && kurbanScope === "picked") {
        const present = new Set<number>();
        for (const r of next) {
          if (r.sacrifice_no != null && Number.isFinite(r.sacrifice_no)) {
            present.add(r.sacrifice_no);
          }
        }
        const newNos = Array.from(present).sort((a, b) => a - b);
        setPickedSacrificeNos((current) =>
          sameSortedNumberArray(current, newNos) ? current : newNos
        );
      }
      return next;
    });
  };

  const removeSacrificeGroup = (sacrificeNo: number) => {
    setRecipients((prev) => prev.filter((r) => r.sacrifice_no !== sacrificeNo));
    if (targetType === "sacrifice_all" && kurbanScope === "picked") {
      setPickedSacrificeNos((p) => p.filter((n) => n !== sacrificeNo));
    }
    toast({
      title: "Kurbanlık çıkarıldı",
      description: `Kurbanlık ${sacrificeNo} için tüm satırlar listeden kaldırıldı.`,
    });
  };

  const showBulkTable =
    ((BULK_LOADING_TARGETS.includes(targetType) ||
      targetType === "shareholder_pick") &&
      recipients.length > 0);
  const showDedup =
    BULK_LOADING_TARGETS.includes(targetType) || targetType === "shareholder_pick";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SMS Gönder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hissedarlara tekil veya toplu SMS gönderin. Değişkenler gönderimde
          otomatik doldurulur.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SmsAdminSection title="Hedef Kitle">
          <div className="space-y-2">
            <Label>Gönderim Tipi</Label>
            <Select
              value={targetType}
              onValueChange={(v) => {
                const tt = v as TargetType;
                setTargetType(tt);
                setRecipients([]);
                setPickedSacrificeNos([]);
                setPickedShareholders([]);
                if (tt === "sacrifice_all") {
                  setKurbanScope("picked");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sacrifice_all">Kurbanlığa göre</SelectItem>
                <SelectItem value="sacrifice_range">
                  Kurbanlık numarası aralığı
                </SelectItem>
                <SelectItem value="after_sacrifice_no">
                  Kurbanlık numarasından sonrakiler
                </SelectItem>
                <SelectItem value="shareholder_pick">
                  Hissedarlardan seç
                </SelectItem>
                <SelectItem value="single_phone">
                  Tekil telefon (manuel)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType === "sacrifice_all" && (
            <SmsSacrificePicker
              options={sacrificeOptions}
              scope={kurbanScope}
              onScopeChange={(s) => {
                setKurbanScope(s);
                setRecipients([]);
              }}
              pickedSacrificeNos={pickedSacrificeNos}
              onPickedNosChange={(nos) => {
                setPickedSacrificeNos(nos);
                setRecipients([]);
              }}
              disabled={loadingRecipients}
            />
          )}

          {targetType === "sacrifice_range" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Başlangıç (kurbanlık no)</Label>
                <Input
                  type="number"
                  min={1}
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  placeholder="Örn. 35"
                />
              </div>
              <div className="space-y-2">
                <Label>Bitiş (kurbanlık no)</Label>
                <Input
                  type="number"
                  min={1}
                  value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value)}
                  placeholder="Örn. 47"
                />
              </div>
            </div>
          )}

          {targetType === "after_sacrifice_no" && (
            <div className="space-y-2">
              <Label>Bu kurbanlık numarasından sonrakiler</Label>
              <Input
                type="number"
                value={afterSacrificeNo}
                onChange={(e) => setAfterSacrificeNo(e.target.value)}
                placeholder="Kurbanlık no (örn. 36)"
              />
            </div>
          )}

          {targetType === "single_phone" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Telefon numarası</Label>
                <Input
                  value={singlePhone}
                  onChange={(e) => setSinglePhone(e.target.value)}
                  placeholder="05xx xxx xx xx"
                />
              </div>
              <div className="space-y-2">
                <Label>Ad Soyad (opsiyonel)</Label>
                <Input
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Hissedar tablosunda olmayan numaralara da gönderim yapılabilir;
                şablon değişkenleri bu kişi için boş kalabilir.
              </p>
            </div>
          )}

          {targetType === "shareholder_pick" && selectedYear != null && (
            <SmsShareholderPicker
              year={selectedYear}
              value={pickedShareholders}
              onChange={setPickedShareholders}
              disabled={loadingRecipients}
            />
          )}

          {BULK_LOADING_TARGETS.includes(targetType) && loadingRecipients && (
            <p className="text-xs text-muted-foreground">Alıcı listesi güncelleniyor…</p>
          )}

          {showDedup && (
            <>
              {BULK_LOADING_TARGETS.includes(targetType) && (
                <div className="space-y-2">
                  <Label htmlFor="sms-delivery-scope">Teslimat kapsamı</Label>
                  <Select
                    value={deliveryRecipientScope}
                    onValueChange={(v) =>
                      setDeliveryRecipientScope(v as DeliveryRecipientScope)
                    }
                  >
                    <SelectTrigger id="sms-delivery-scope" className="max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Herkese (tüm teslim tercihleri)</SelectItem>
                      <SelectItem value="slaughterhouse">
                        Yalnızca kesimhanede teslim alacaklar
                      </SelectItem>
                      <SelectItem value="other">
                        Yalnızca kesimhane dışında teslim (Ulus, adrese teslim vb.)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {isSuperAdmin && (
                <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Tekrarlayan numara
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="dedup-toggle" className="text-sm">
                        Aynı kurbanlıkta birleştir
                      </Label>
                      <p className="text-xs text-muted-foreground leading-snug">
                        Bir kurbanlıkta aynı cep numarasına tek SMS gider. Bizim SMS operatörü
                        yaklaşık 2 dakika içinde aynı numaraya aynı içerikli tekrar gönderimi
                        reddeder; bu birleştirme ise gönderimden önce mükerrer alıcıları eler ve
                        gereksiz API çağrısı yapılmasını önler.
                      </p>
                    </div>
                    <Switch id="dedup-toggle" checked disabled />
                  </div>
                </div>
              )}
            </>
          )}
        </SmsAdminSection>

        <SmsAdminSection title="Mesaj">
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Şablondan seç</Label>
              <Select
                onValueChange={(id) => {
                  const tpl = templates.find((t) => t.id === id);
                  if (tpl) setMessageContent(tpl.content);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şablon seç (opsiyonel)..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <SmsEditor value={messageContent} onChange={setMessageContent} />
        </SmsAdminSection>
      </div>

      {showBulkTable && (
        <SmsAdminSection
          title="Yüklenen Alıcılar"
          headerAside={
            <span className="text-xs text-muted-foreground tabular-nums sm:text-sm">
              Toplam satır:{" "}
              <strong className="font-medium text-foreground">{recipients.length}</strong>
            </span>
          }
          bodyClassName="pt-2"
        >
          <SmsRecipientTable
            recipients={recipients}
            onToggleInclude={toggleRecipientInclude}
            onCommitListSave={commitRecipientListSave}
            onRemoveSacrificeGroup={removeSacrificeGroup}
          />
        </SmsAdminSection>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          className="admin-tenant-accent"
          onClick={handlePreview}
          disabled={isSending}
        >
          Önizle ve gönder
        </Button>
      </div>

      {previewStats && (
        <SmsPreviewDialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          onConfirm={handleSend}
          stats={previewStats}
          isLoading={isSending}
        />
      )}
    </div>
  );
}
