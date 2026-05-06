"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  completed:     { label: "Operatöre gönderildi", variant: "default" },
  partial_fail:  { label: "Kısmen gönderildi",    variant: "secondary" },
  failed:        { label: "Başarısız",             variant: "destructive" },
  sending:       { label: "Gönderiliyor",          variant: "secondary" },
  queued:        { label: "Kuyrukta",              variant: "outline" },
  draft:         { label: "Taslak",                variant: "outline" },
  cancelled:     { label: "İptal edildi",          variant: "outline" },
};

const RECIPIENT_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  sent:    { label: "Operatöre iletildi", variant: "default" },
  failed:  { label: "Gönderilemedi",     variant: "destructive" },
  skipped: { label: "Atlandı",           variant: "outline" },
  queued:  { label: "Bekliyor",          variant: "secondary" },
};

/**
 * DLR durum kodları (sms_send_recipients.dlr_status):
 * null → Rapor bekleniyor
 *  0   → Bekliyor
 *  5   → Operatöre iletildi
 *  6   → Ulaşmadı
 *  9   → Telefona ulaştı
 */
const DLR_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  null: { label: "Rapor bekleniyor", variant: "outline" },
  "0":  { label: "Bekliyor",         variant: "secondary" },
  "5":  { label: "Operatöre iletildi", variant: "secondary" },
  "6":  { label: "Ulaşmadı",         variant: "destructive" },
  "9":  { label: "Telefona ulaştı",  variant: "default" },
};

interface Props {
  status: string | number | null;
  type?: "send" | "recipient" | "dlr";
}

export function SmsSendStatusBadge({ status, type = "send" }: Props) {
  const key = status === null || status === undefined ? "null" : String(status);

  const config =
    type === "recipient"
      ? (RECIPIENT_STATUS_CONFIG[key] ?? { label: key, variant: "outline" as const })
      : type === "dlr"
      ? (DLR_STATUS_CONFIG[key] ?? { label: key, variant: "outline" as const })
      : (STATUS_CONFIG[key] ?? { label: key, variant: "outline" as const });

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
