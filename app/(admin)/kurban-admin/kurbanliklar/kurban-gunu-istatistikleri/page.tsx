"use client";

import { CustomDataTable } from "@/components/custom-data-components/custom-data-table";
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
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatHisseBilgisiForExcel } from "@/lib/excel-export/format-hisse-bilgisi";
import { normalizeTurkishSearchText } from "@/lib/turkish-search-normalize";
import { useStageMetricsStore } from "@/stores/global/useStageMetricsStore";
import { useAdminYearStore } from "@/stores/only-admin-pages/useAdminYearStore";
import {
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminSearchToolbarTableSkeleton } from "../../components/admin-page-skeletons";
import {
  animalColumns,
  kurbanGunuAnimalColumnHeaderLabels,
  type KurbanGunuAnimalRow,
} from "./components/animal-columns";
import {
  downtimeColumns,
  kurbanGunuDowntimeColumnHeaderLabels,
  type AffectedStage,
  type DowntimeEvent,
  type DowntimeTableMeta,
} from "./components/downtime-columns";
import { KurbanGunuTableToolbar } from "./components/kurban-gunu-table-toolbar";
import { StageStatusCards } from "./components/stage-status-cards";

const EMPTY_FORM = {
  affected_stage: "slaughter" as AffectedStage,
  started_time: "",
  ended_time: "",
  note: "",
};

function calcDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return Math.max(0, diff);
}

export default function KurbanGunuIstatistikleriPage() {
  const { toast } = useToast();
  const selectedYear = useAdminYearStore((s) => s.selectedYear);
  const { stageMetrics, isLoading: metricsLoading, fetchStageMetrics } = useStageMetricsStore();

  const [animals, setAnimals] = useState<KurbanGunuAnimalRow[]>([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalSearch, setAnimalSearch] = useState("");

  const [downtimes, setDowntimes] = useState<DowntimeEvent[]>([]);
  const [downtimesLoading, setDowntimesLoading] = useState(true);
  const [downtimeSearch, setDowntimeSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formSaving, setFormSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerLoading, setBannerLoading] = useState(true);
  const [bannerSaving, setBannerSaving] = useState(false);

  const yearParam = selectedYear ? `?year=${selectedYear}` : "";

  const fetchAnimals = useCallback(async () => {
    setAnimalsLoading(true);
    try {
      const res = await fetch(`/api/get-sacrifice-animals${yearParam}`);
      if (!res.ok) throw new Error("fetch error");
      const data = await res.json();
      setAnimals(Array.isArray(data) ? data : []);
    } catch {
      setAnimals([]);
    } finally {
      setAnimalsLoading(false);
    }
  }, [yearParam]);

  const fetchDowntimes = useCallback(async () => {
    setDowntimesLoading(true);
    try {
      const res = await fetch(`/api/admin/stage-downtime${yearParam}`);
      if (!res.ok) throw new Error("fetch error");
      const json = await res.json();
      setDowntimes(json.data ?? []);
    } catch {
      setDowntimes([]);
    } finally {
      setDowntimesLoading(false);
    }
  }, [yearParam]);

  const fetchBanner = useCallback(async () => {
    setBannerLoading(true);
    try {
      const res = await fetch("/api/admin/incident-banner");
      if (!res.ok) throw new Error("fetch error");
      const json = await res.json();
      setBannerEnabled(json.incident_banner_enabled ?? false);
      setBannerMessage(json.incident_banner_message ?? "");
    } catch {
      /* ignore */
    } finally {
      setBannerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStageMetrics();
    fetchAnimals();
    fetchDowntimes();
    fetchBanner();
  }, [fetchStageMetrics, fetchAnimals, fetchDowntimes, fetchBanner]);

  const filteredAnimals = useMemo(() => {
    const q = normalizeTurkishSearchText(animalSearch.trim());
    if (!q) return animals;
    return animals.filter((a) => {
      const blob = normalizeTurkishSearchText(
        [
          String(a.sacrifice_no),
          a.animal_type,
          formatHisseBilgisiForExcel(a),
        ].join(" ")
      );
      return blob.includes(q);
    });
  }, [animals, animalSearch]);

  const filteredDowntimes = useMemo(() => {
    const q = normalizeTurkishSearchText(downtimeSearch.trim());
    if (!q) return downtimes;
    return downtimes.filter((d) => {
      const blob = normalizeTurkishSearchText(
        [d.affected_stage, d.started_time, d.ended_time, d.note ?? ""].join(" ")
      );
      return blob.includes(q);
    });
  }, [downtimes, downtimeSearch]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  }

  const openEdit = useCallback((d: DowntimeEvent) => {
    setEditingId(d.id);
    const ongoing =
      d.duration_minutes === 0 && d.started_time.slice(0, 5) === d.ended_time.slice(0, 5);
    setForm({
      affected_stage: d.affected_stage,
      started_time: d.started_time.slice(0, 5),
      ended_time: ongoing ? "" : d.ended_time.slice(0, 5),
      note: d.note ?? "",
    });
    setDialogOpen(true);
  }, []);

  async function handleSaveDowntime() {
    const { affected_stage, started_time, ended_time, note } = form;
    if (!started_time) {
      toast({ title: "Başlangıç saatini giriniz", variant: "destructive" });
      return;
    }

    const effectiveEnd = ended_time.trim() || started_time;
    const duration_minutes = ended_time.trim()
      ? calcDuration(started_time, ended_time)
      : 0;

    if (ended_time.trim() && duration_minutes <= 0) {
      toast({ title: "Bitiş saati başlangıçtan büyük olmalıdır", variant: "destructive" });
      return;
    }

    setFormSaving(true);
    try {
      const url = editingId
        ? `/api/admin/stage-downtime/${editingId}`
        : `/api/admin/stage-downtime${yearParam}`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affected_stage,
          started_time,
          ended_time: effectiveEnd,
          duration_minutes,
          note: note || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Kayıt hatası");
      }
      toast({ title: editingId ? "Arıza kaydı güncellendi" : "Arıza kaydı eklendi" });
      setDialogOpen(false);
      await fetchDowntimes();
      await fetchStageMetrics();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bir hata oluştu";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDeleteDowntime(id: string) {
    try {
      const res = await fetch(`/api/admin/stage-downtime/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme hatası");
      toast({ title: "Arıza kaydı silindi" });
      setDowntimes((prev) => prev.filter((d) => d.id !== id));
      await fetchStageMetrics();
    } catch {
      toast({ title: "Arıza kaydı silinemedi", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  async function handleSaveBanner() {
    setBannerSaving(true);
    try {
      const res = await fetch("/api/admin/incident-banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_banner_enabled: bannerEnabled,
          incident_banner_message: bannerMessage,
        }),
      });
      if (!res.ok) throw new Error("Güncelleme hatası");
      toast({ title: "Arıza duyurusu güncellendi" });
    } catch {
      toast({ title: "Duyuru güncellenemedi", variant: "destructive" });
    } finally {
      setBannerSaving(false);
    }
  }

  const downtimeMeta = useMemo<DowntimeTableMeta>(
    () => ({
      onEdit: openEdit,
      onDelete: (id) => setDeleteId(id),
    }),
    [openEdit]
  );

  const durationLabel =
    form.started_time && form.ended_time
      ? `${calcDuration(form.started_time, form.ended_time)} dk`
      : form.started_time && !form.ended_time
        ? "Bitiş girilmedi (devam ediyor)"
        : "—";

  return (
    <div className="space-y-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Kurban Günü İstatistikleri</h1>
        <p className="text-muted-foreground mt-2 max-w-[75%]">
          Aşama ilerlemesi, arıza kayıtları ve arıza duyurusu yönetimi
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Aşama Durumu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchStageMetrics()}
            disabled={metricsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${metricsLoading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>
        <StageStatusCards stageMetrics={stageMetrics} loading={metricsLoading} />
      </section>

      <section className="font-sans">
        <h2 className="text-lg font-semibold mb-3">Kurbanlıklar</h2>
        {animalsLoading ? (
          <AdminSearchToolbarTableSkeleton rows={10} />
        ) : (
          <CustomDataTable
            columns={animalColumns}
            data={filteredAnimals}
            getRowId={(row) => row.sacrifice_id}
            storageKey="kurban-gunu-animals"
            columnHeaderLabels={kurbanGunuAnimalColumnHeaderLabels}
            tableSize="medium"
            pageSizeOptions={[20, 50, 100, 200]}
            filters={({ table, columnFilters, columnOrder, onColumnOrderChange, resetColumnLayout }) => (
              <KurbanGunuTableToolbar
                table={table}
                columnFilters={columnFilters}
                columnOrder={columnOrder ?? []}
                onColumnOrderChange={onColumnOrderChange}
                resetColumnLayout={resetColumnLayout}
                searchTerm={animalSearch}
                setSearchTerm={setAnimalSearch}
                searchPlaceholder="Kurban no, tür veya hisse bilgisinde ara…"
                columnHeaderMap={kurbanGunuAnimalColumnHeaderLabels}
              />
            )}
          />
        )}
      </section>

      <section className="font-sans">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <h2 className="text-lg font-semibold">Arıza Kayıtları</h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              Kayıtlar aşama ortalama süresi hesabından çıkarılır. Çakışan aralıklar otomatik birleştirilir.
            </p>
          </div>
          <Button size="sm" onClick={openAdd} className="shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Arıza Ekle
          </Button>
        </div>
        {downtimesLoading ? (
          <AdminSearchToolbarTableSkeleton rows={6} />
        ) : (
          <CustomDataTable
            columns={downtimeColumns}
            data={filteredDowntimes}
            getRowId={(row) => row.id}
            storageKey="kurban-gunu-downtime"
            columnHeaderLabels={kurbanGunuDowntimeColumnHeaderLabels}
            meta={downtimeMeta}
            tableSize="medium"
            pageSizeOptions={[10, 20, 50, 100]}
            filters={({ table, columnFilters, columnOrder, onColumnOrderChange, resetColumnLayout }) => (
              <KurbanGunuTableToolbar
                table={table}
                columnFilters={columnFilters}
                columnOrder={columnOrder ?? []}
                onColumnOrderChange={onColumnOrderChange}
                resetColumnLayout={resetColumnLayout}
                searchTerm={downtimeSearch}
                setSearchTerm={setDowntimeSearch}
                searchPlaceholder="Aşama, saat veya notta ara…"
                columnHeaderMap={kurbanGunuDowntimeColumnHeaderLabels}
              />
            )}
          />
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Arıza Duyurusu</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {bannerLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Switch
                    id="banner-enabled"
                    checked={bannerEnabled}
                    onCheckedChange={setBannerEnabled}
                  />
                  <Label htmlFor="banner-enabled" className="cursor-pointer">
                    Arıza uyarısını sitede göster
                  </Label>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banner-message">Duyuru metni</Label>
                  <Textarea
                    id="banner-message"
                    placeholder="Teknik arıza nedeniyle hizmetimizde geçici aksaklık yaşanmaktadır. En kısa sürede normale dönülecektir."
                    value={bannerMessage}
                    onChange={(e) => setBannerMessage(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Banner yalnızca anasayfa (/) ve takip önizlemesinde (/onizleme/takip) gösterilir.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveBanner} disabled={bannerSaving}>
                    {bannerSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Kaydet
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border-2 border-red-500">
          <DialogHeader>
            <DialogTitle>{editingId ? "Arıza Kaydını Düzenle" : "Arıza Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Etkilenen Aşama</Label>
              <Select
                value={form.affected_stage}
                onValueChange={(v) => setForm((f) => ({ ...f, affected_stage: v as AffectedStage }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slaughter">Kesim</SelectItem>
                  <SelectItem value="butcher">Parçalama</SelectItem>
                  <SelectItem value="delivery">Teslimat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="started_time">Başlangıç (SS:DD)</Label>
                <Input
                  id="started_time"
                  type="time"
                  value={form.started_time}
                  onChange={(e) => setForm((f) => ({ ...f, started_time: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ended_time">Bitiş (SS:DD)</Label>
                <Input
                  id="ended_time"
                  type="time"
                  value={form.ended_time}
                  onChange={(e) => setForm((f) => ({ ...f, ended_time: e.target.value }))}
                />
              </div>
            </div>
            {form.started_time && (
              <p className="text-sm text-muted-foreground">
                Hesaplanan süre: <strong>{durationLabel}</strong>
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="note">Not</Label>
              <Input
                id="note"
                placeholder="İsteğe bağlı — ör: Kesim makinesi arızalandı"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={formSaving}>
              İptal
            </Button>
            <Button onClick={handleSaveDowntime} disabled={formSaving}>
              {formSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arıza kaydını sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu arıza kaydı kalıcı olarak silinecek. Ortalama süreler yeniden hesaplanacak. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => deleteId && handleDeleteDowntime(deleteId)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
