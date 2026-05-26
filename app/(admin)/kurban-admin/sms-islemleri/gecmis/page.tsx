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
import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { RefreshCw, RotateCcw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SmsSendStatusBadge } from "../components/sms-send-status-badge";
import {
  createSmsGecmisColumns,
  smsGecmisColumnHeaderLabels,
  SmsSendRow,
  SmsGecmisMeta,
} from "./components/sms-gecmis-columns";
import { SmsGecmisToolbar } from "./components/sms-gecmis-toolbar";

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
  const [sends, setSends] = useState<SmsSendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    send: SmsSendRow;
    recipients: SmsRecipient[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<
    | null
    | { type: "cancel"; id: string; title: string }
    | { type: "delete"; id: string; title: string }
    | { type: "retry"; id: string }
    | { type: "bulk-delete"; ids: string[] }
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
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
        window.dispatchEvent(new Event("sms-sends-updated"));
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
        window.dispatchEvent(new Event("sms-sends-updated"));
        loadSends();
        if (detailId === id) {
          setDetailId(null);
          setDetailData(null);
        }
      } else {
        toast({ title: "Silinemedi", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const executeBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/admin/sms/sends/${id}`, { method: "DELETE" });
          const data = await res.json().catch(() => ({}));
          return { id, ok: res.ok, error: data.error as string | undefined };
        })
      );
      const failed = results.filter((r) => !r.ok);
      const succeeded = results.filter((r) => r.ok);

      if (succeeded.length > 0) {
        window.dispatchEvent(new Event("sms-sends-updated"));
        loadSends();
        if (detailId && succeeded.some((r) => r.id === detailId)) {
          setDetailId(null);
          setDetailData(null);
        }
      }

      if (failed.length === 0) {
        toast({
          title: "Seçilen gönderimler silindi",
          description: `${succeeded.length.toLocaleString("tr-TR")} kayıt kaldırıldı.`,
        });
      } else if (succeeded.length === 0) {
        toast({
          title: "Silinemedi",
          description: failed[0]?.error ?? "Seçilen kayıtlar silinemedi.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Kısmen silindi",
          description: `${succeeded.length.toLocaleString("tr-TR")} kayıt silindi, ${failed.length.toLocaleString("tr-TR")} kayıt silinemedi.`,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setBulkDeleting(false);
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
          description: `${data.sent} alıcıya tekrar gönderildi`,
        });
        window.dispatchEvent(new Event("sms-sends-updated"));
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

  const requestBulkDelete = (ids: string[]) =>
    setConfirmDialog({ type: "bulk-delete", ids });

  const runPendingConfirm = () => {
    setConfirmDialog((d) => {
      if (!d) return null;
      const payload = d;
      queueMicrotask(() => {
        if (payload.type === "cancel") void executeCancelSend(payload.id);
        else if (payload.type === "delete") void executeDeletePermanent(payload.id);
        else if (payload.type === "retry") void executeRetrySend(payload.id);
        else if (payload.type === "bulk-delete") void executeBulkDelete(payload.ids);
      });
      return null;
    });
  };

  const failedCount = (s: SmsSendRow) => s.failed_count ?? 0;

  const senderLabel = (s: SmsSendRow) =>
    (s.created_by_display && s.created_by_display.trim()) || s.created_by || "—";

  const filteredSends = useMemo(() => {
    if (!searchTerm.trim()) return sends;
    const q = searchTerm.trim().toLowerCase();
    return sends.filter((s) => (s.message_content ?? "").toLowerCase().includes(q));
  }, [sends, searchTerm]);

  const canDeleteHistoryRow = session?.user?.role === "super_admin";

  const columns = useMemo(
    () => createSmsGecmisColumns({ enableSelection: canDeleteHistoryRow }),
    [canDeleteHistoryRow]
  );

  // Başarılı retry ile yeniden denenen orijinal send ID'leri
  const retriedIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of sends) {
      const tp = s.target_params;
      if (tp?.retry_of && typeof tp.retry_of === "string" && s.status === "completed") {
        set.add(tp.retry_of);
      }
    }
    return set;
  }, [sends]);

  const tableMeta: SmsGecmisMeta = useMemo(
    () => ({
      onDetail: openDetail,
      onRetry: requestRetry,
      onCancel: requestCancel,
      onDelete: requestDelete,
      retryingId,
      cancellingId,
      deletingId,
      canDelete: canDeleteHistoryRow,
      retriedIds,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [retryingId, cancellingId, deletingId, canDeleteHistoryRow, retriedIds]
  );

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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card className="shadow-none rounded-md sm:col-span-1">
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
          <Card className="shadow-none rounded-md sm:col-span-1">
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

      <CustomDataTable
        columns={columns}
        data={filteredSends}
        getRowId={(row) => row.id}
        storageKey="sms-gecmis"
        enableRowSelection={canDeleteHistoryRow}
        tableSize="medium"
        pageSizeOptions={[20, 50, 100]}
        defaultPageSize={20}
        columnHeaderLabels={smsGecmisColumnHeaderLabels}
        meta={tableMeta}
        filters={({ table, columnFilters, onColumnFiltersChange, onColumnOrderChange, columnOrder, resetColumnLayout }) => (
          <SmsGecmisToolbar
            table={table}
            columnFilters={columnFilters}
            columnVisibility={table.getState().columnVisibility}
            onColumnFiltersChange={onColumnFiltersChange}
            onColumnOrderChange={onColumnOrderChange}
            onResetColumnLayout={resetColumnLayout}
            columnOrder={columnOrder}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            canDelete={canDeleteHistoryRow}
            onBulkDelete={requestBulkDelete}
            bulkDeleting={bulkDeleting}
            selectedRowCount={table.getFilteredSelectedRowModel().rows.length}
          />
        )}
        initialState={{
          columnVisibility: { excluded_count: false },
          sorting: [{ id: "created_at", desc: true }],
        }}
      />

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
                {detailData.send.target_params?.retry_of != null && (
                  <div>
                    <span className="text-muted-foreground">Tekrar deneme: </span>
                    <span className="text-blue-600 text-xs font-medium">
                      Orijinal kayda bağlı tekrar deneme
                    </span>
                  </div>
                )}
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
                failedCount(detailData.send) > 0 &&
                !retriedIds.has(detailData.send.id) && (
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
              {confirmDialog?.type === "bulk-delete" && "Seçilen gönderimleri sil"}
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
              {confirmDialog?.type === "bulk-delete" &&
                `${confirmDialog.ids.length.toLocaleString("tr-TR")} gönderim kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`}
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
