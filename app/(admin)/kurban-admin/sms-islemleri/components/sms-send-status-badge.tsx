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

interface Props {
  status: string | number | null;
  type?: "send" | "recipient";
}

export function SmsSendStatusBadge({ status, type = "send" }: Props) {
  const key = status === null || status === undefined ? "null" : String(status);

  const config =
    type === "recipient"
      ? (RECIPIENT_STATUS_CONFIG[key] ?? { label: key, variant: "outline" as const })
      : (STATUS_CONFIG[key] ?? { label: key, variant: "outline" as const });

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
