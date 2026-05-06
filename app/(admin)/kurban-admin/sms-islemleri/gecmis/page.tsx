"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { ExternalLink, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SmsSendStatusBadge } from "../components/sms-send-status-badge";

interface SmsSend {
  id: string;
  title: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  excluded_count: number;
  sacrifice_year: number;
  created_by: string;
  created_at: string;
  completed_at: string | null;
  target_params: Record<string, unknown> | null;
}

interface SmsRecipient {
  id: string;
  recipient_name: string | null;
  phone_number: string;
  personalized_message: string;
  sms_parts: number | null;
  status: string;
  skip_reason: string | null;
  error_code: string | null;
  dlr_status: number | null;
  dlr_completed: boolean;
  sent_at: string | null;
}

interface SmsStats {
  total_sends: number;
  total_operator_delivered: number;
  total_failed: number;
  dlr_phone_delivered: number;
  dlr_phone_failed: number;
  dlr_pending: number;
}

export default function SmsGecmisPage() {
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const [sends, setSends] = useState<SmsSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    send: SmsSend;
    recipients: SmsRecipient[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadSends = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.set("year", String(selectedYear));
      const [sendsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/sms/sends?${params}`),
        fetch(`/api/admin/sms/stats?${params}`),
      ]);
      const sendsData = await sendsRes.json();
      setSends(sendsData.sends ?? []);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch {
      toast({ title: "Gönderim geçmişi yüklenemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadSends();
  }, [loadSends]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/sms/sends/${id}`);
      const data = await res.json();
      if (res.ok) setDetailData(data);
    } catch {
      toast({ title: "Detay yüklenemedi", variant: "destructive" });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCancel = async (id: string, title: string) => {
    if (!confirm(`"${title}" gönderimini iptal etmek istiyor musunuz?`)) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/admin/sms/sends/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Gönderim iptal edildi" });
        loadSends();
      } else {
        toast({ title: "İptal başarısız", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setCancellingId(null);
    }
  };

  const handleRetry = async (id: string) => {
    if (!confirm("Başarısız alıcılar yeni bir gönderim kaydıyla tekrar denenecek. Devam edilsin mi?")) return;
    setRetryingId(id);
    try {
      const res = await fetch(`/api/admin/sms/sends/${id}/retry`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Tekrar gönderim başlatıldı",
          description: `Yeni gönderim ID: ${data.newSendId} — ${data.sent} gönderildi`,
        });
        loadSends();
        if (detailId === id) {
          setDetailId(null);
          setDetailData(null);
        }
      } else {
        toast({ title: "Tekrar deneme başarısız", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setRetryingId(null);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString("tr-TR") : "—";

  const failedCount = (s: SmsSend) => s.failed_count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gönderim Geçmişi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Geçmiş SMS gönderimlerini, alıcı detaylarını ve iletim raporlarını görüntüleyin.
          </p>
        </div>
        <Button variant="outline" onClick={loadSends} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* İstatistik Kartları */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="shadow-none rounded-md">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Toplam Gönderim
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold">{stats.total_sends}</div>
            </CardContent>
          </Card>
          <Card className="shadow-none rounded-md">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Operatöre İletilen
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold text-green-600">
                {stats.total_operator_delivered.toLocaleString("tr-TR")}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none rounded-md">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Telefona Ulaşan
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold text-blue-600">
                {stats.dlr_phone_delivered.toLocaleString("tr-TR")}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none rounded-md">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Ulaşmayan SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold text-destructive">
                {(stats.total_failed + stats.dlr_phone_failed).toLocaleString("tr-TR")}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none rounded-md">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Bekleyen DLR
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold text-muted-foreground">
                {stats.dlr_pending.toLocaleString("tr-TR")}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tablo */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : sends.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Henüz gönderim yapılmadı.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlık</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead className="text-right">Gönderilen</TableHead>
                <TableHead className="text-right">Başarısız</TableHead>
                <TableHead className="text-right">Dışlanan</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sends.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {s.title}
                  </TableCell>
                  <TableCell>
                    <SmsSendStatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right">{s.total_recipients}</TableCell>
                  <TableCell className="text-right text-green-600">{s.sent_count}</TableCell>
                  <TableCell className="text-right text-destructive">
                    {s.failed_count}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {s.excluded_count}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(s.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {s.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={cancellingId === s.id}
                          onClick={() => handleCancel(s.id, s.title)}
                          title="Gönderimi İptal Et"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {(s.status === "completed" || s.status === "partial_fail" || s.status === "failed") &&
                        failedCount(s) > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            disabled={retryingId === s.id}
                            onClick={() => handleRetry(s.id)}
                            title="Başarısızları Tekrar Dene"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openDetail(s.id)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detay Dialog */}
      <Dialog open={!!detailId} onOpenChange={(v) => !v && (setDetailId(null), setDetailData(null))}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailData?.send?.title ?? "Gönderim Detayı"}</DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
          ) : detailData ? (
            <div className="space-y-4">
              {/* Özet bilgiler */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Durum: </span>
                  <SmsSendStatusBadge status={detailData.send.status} />
                </div>
                <div>
                  <span className="text-muted-foreground">Gönderen: </span>
                  {detailData.send.created_by}
                </div>
                <div>
                  <span className="text-muted-foreground">Toplam alıcı: </span>
                  {detailData.send.total_recipients}
                </div>
                <div>
                  <span className="text-muted-foreground">İletildi / Başarısız / Dışlanan: </span>
                  {detailData.send.sent_count} / {detailData.send.failed_count} /{" "}
                  {detailData.send.excluded_count}
                </div>
              </div>

              {/* DLR özeti */}
              {(() => {
                const r = detailData.recipients;
                const operatorDelivered = r.filter((x) => x.status === "sent").length;
                const phoneDelivered = r.filter((x) => x.dlr_status === 9).length;
                const notDelivered = r.filter((x) => x.dlr_status === 6).length;
                const waitingDlr = r.filter(
                  (x) => x.status === "sent" && x.dlr_status == null
                ).length;
                const pending = r.filter(
                  (x) => x.dlr_status === 0 || x.dlr_status === 5
                ).length;
                if (operatorDelivered === 0) return null;
                return (
                  <div className="rounded-md bg-muted/50 px-4 py-3 text-sm grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">Operatöre iletildi:</div>
                    <div className="font-medium">{operatorDelivered}</div>
                    <div className="text-muted-foreground">Telefona ulaştı (DLR):</div>
                    <div className="font-medium text-blue-600">{phoneDelivered}</div>
                    <div className="text-muted-foreground">Ulaşmadı (DLR):</div>
                    <div className="font-medium text-destructive">{notDelivered}</div>
                    <div className="text-muted-foreground">DLR bekliyor:</div>
                    <div className="font-medium text-muted-foreground">
                      {waitingDlr + pending}
                    </div>
                  </div>
                );
              })()}

              {/* Retry butonu (detay içinde) */}
              {(detailData.send.status === "completed" ||
                detailData.send.status === "partial_fail" ||
                detailData.send.status === "failed") &&
                failedCount(detailData.send) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={retryingId === detailData.send.id}
                    onClick={() => handleRetry(detailData.send.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {retryingId === detailData.send.id
                      ? "Deneniyor..."
                      : `${failedCount(detailData.send)} Başarısızı Tekrar Dene`}
                  </Button>
                )}

              {/* Alıcı tablosu */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Gönderim</TableHead>
                      <TableHead>DLR</TableHead>
                      <TableHead>Sebep</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.recipients.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.recipient_name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{r.phone_number}</TableCell>
                        <TableCell>
                          <SmsSendStatusBadge status={r.status} type="recipient" />
                        </TableCell>
                        <TableCell>
                          {r.status === "sent" ? (
                            <SmsSendStatusBadge
                              status={r.dlr_status}
                              type="dlr"
                            />
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.skip_reason ?? r.error_code ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
