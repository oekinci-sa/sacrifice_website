"use client";

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
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { ExternalLink, RefreshCw, RotateCcw, Trash2, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { SmsSendStatusBadge } from "../components/sms-send-status-badge";
import { SmsTruncatedHoverTip } from "@/components/sms-truncated-hover-tooltip";

interface SmsSend {
  id: string;
  title: string;
  message_content: string | null;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  excluded_count: number;
  sacrifice_year: number;
  created_by: string;
  /** users.name veya bilinen e-posta eşlemesi; yoksa e-posta ile aynı */
  created_by_display?: string | null;
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
  sent_at: string | null;
}

interface SmsStats {
  total_operator_delivered: number;
  total_failed: number;
}

export default function SmsGecmisPage() {
  const { data: session } = useSession();
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<
    | null
    | { type: "cancel"; id: string; title: string }
    | { type: "delete"; id: string; title: string }
    | { type: "retry"; id: string }
  >(null);

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
        setStats({
          total_operator_delivered: statsData.total_operator_delivered ?? 0,
          total_failed: statsData.total_failed ?? 0,
        });
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

  const executeCancelSend = async (id: string) => {
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

  const executeDeletePermanent = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/sms/sends/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Gönderim kaydı silindi" });
        loadSends();
        if (detailId === id) {
          setDetailId(null);
          setDetailData(null);
        }
      } else {
        toast({
          title: "Silinemedi",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const executeRetrySend = async (id: string) => {
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

  const requestCancel = (id: string, title: string) =>
    setConfirmDialog({ type: "cancel", id, title });

  const requestDelete = (id: string, title: string) =>
    setConfirmDialog({ type: "delete", id, title });

  const requestRetry = (id: string) => setConfirmDialog({ type: "retry", id });

  const runPendingConfirm = () => {
    setConfirmDialog((d) => {
      if (!d) return null;
      const payload = d;
      queueMicrotask(() => {
        if (payload.type === "cancel") void executeCancelSend(payload.id);
        else if (payload.type === "delete") void executeDeletePermanent(payload.id);
        else void executeRetrySend(payload.id);
      });
      return null;
    });
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString("tr-TR") : "—";

  const failedCount = (s: SmsSend) => s.failed_count ?? 0;

  const senderLabel = (s: SmsSend) =>
    (s.created_by_display && s.created_by_display.trim()) || s.created_by || "—";

  const canDeleteHistoryRow = session?.user?.role === "super_admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gönderim Geçmişi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Geçmiş SMS gönderimlerini ve alıcı özeti için detayı açın.
          </p>
        </div>
        <Button variant="outline" onClick={loadSends} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* İstatistik özeti */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="shadow-none rounded-md">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Operatöre iletilen (toplam gönderilen)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold text-green-600 tabular-nums">
                {stats.total_operator_delivered.toLocaleString("tr-TR")}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none rounded-md">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Gönderilemeyen alıcı
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold text-destructive tabular-nums">
                {stats.total_failed.toLocaleString("tr-TR")}
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
                <TableHead className="whitespace-nowrap min-w-[140px]">Tarih</TableHead>
                <TableHead className="min-w-[120px] max-w-[260px]">Mesaj</TableHead>
                <TableHead className="min-w-[96px]">Gönderen</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead className="text-right">Gönderilen</TableHead>
                <TableHead className="text-right">Başarısız</TableHead>
                <TableHead className="text-right">Dışlanan</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sends.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap align-top">
                    {formatDate(s.created_at)}
                  </TableCell>
                  <TableCell className="max-w-[260px] align-top">
                    <SmsTruncatedHoverTip fullText={(s.message_content ?? "").trim()}>
                      <span className="line-clamp-2 text-xs text-muted-foreground whitespace-pre-wrap">
                        {(s.message_content ?? "").trim() || "—"}
                      </span>
                    </SmsTruncatedHoverTip>
                  </TableCell>
                  <TableCell className="max-w-[200px] text-sm truncate">
                    <SmsTruncatedHoverTip fullText={senderLabel(s)}>
                      <span className="truncate block">{senderLabel(s)}</span>
                    </SmsTruncatedHoverTip>
                  </TableCell>
                  <TableCell className="text-right">{s.total_recipients}</TableCell>
                  <TableCell className="text-right text-green-600">{s.sent_count}</TableCell>
                  <TableCell className="text-right text-destructive">
                    {s.failed_count}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {s.excluded_count}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-1">
                      {s.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={cancellingId === s.id}
                          onClick={() => requestCancel(s.id, s.title)}
                          title="Taslağı iptal et"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteHistoryRow && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === s.id}
                          onClick={() => requestDelete(s.id, s.title)}
                          title="Kaydı kalıcı sil (süper yönetici)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {(s.status === "completed" || s.status === "partial_fail" || s.status === "failed") &&
                        failedCount(s) > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            disabled={retryingId === s.id}
                            onClick={() => requestRetry(s.id)}
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
                  <span className="text-muted-foreground">Gönderen: </span>
                  {senderLabel(detailData.send)}
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

              {(detailData.send.message_content ?? "").trim().length > 0 && (
                <div className="rounded-md border bg-muted/20 p-3 text-sm">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Gönderilen metin
                  </div>
                  <p className="whitespace-pre-wrap break-words">
                    {(detailData.send.message_content ?? "").trim()}
                  </p>
                </div>
              )}

              {/* Retry butonu (detay içinde) */}
              {(detailData.send.status === "completed" ||
                detailData.send.status === "partial_fail" ||
                detailData.send.status === "failed") &&
                failedCount(detailData.send) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={retryingId === detailData.send.id}
                    onClick={() => requestRetry(detailData.send.id)}
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
                      <TableHead>Sebep</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.recipients.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.recipient_name ?? "—"}</TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {formatPhoneForDisplayWithSpacing(r.phone_number)}
                        </TableCell>
                        <TableCell>
                          <SmsSendStatusBadge status={r.status} type="recipient" />
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

      <AlertDialog
        open={confirmDialog !== null}
        onOpenChange={(o) => !o && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.type === "cancel" && "Taslağı iptal et"}
              {confirmDialog?.type === "delete" && "Gönderimi kalıcı olarak sil"}
              {confirmDialog?.type === "retry" && "Başarısız alıcıları tekrar dene"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.type === "cancel" && (
                <>
                  <span className="font-medium text-foreground">
                    {confirmDialog.title}
                  </span>{" "}
                  başlıklı taslak iptal edilecek. Emin misiniz?
                </>
              )}
              {confirmDialog?.type === "delete" && (
                <>
                  <span className="font-medium text-foreground">
                    {confirmDialog.title}
                  </span>{" "}
                  kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
                </>
              )}
              {confirmDialog?.type === "retry" &&
                "Başarısız alıcılar yeni bir gönderim kaydıyla tekrar denenecek."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={() => runPendingConfirm()}>Onayla</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
