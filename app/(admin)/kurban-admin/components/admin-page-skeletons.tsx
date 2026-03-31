"use client";

/**
 * Admin menü sayfalarında ortak yükleme iskeleti: başlık/açıklama sayfada sabit kalır;
 * içerik alanı bu bileşenlerle doldurulur (spinner kullanılmaz).
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Kurbanlıklar / Hissedarlar / Değişiklik kayıtları: üst araç çubuğu + filtre rozeti + tablo */
export function AdminDataTablePageSkeleton({
  rows = 10,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full max-w-[28rem] rounded-md" />
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-8 w-[88px] rounded-md" />
          <Skeleton className="h-8 w-[100px] rounded-md" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      <div className="rounded-md border bg-card overflow-hidden">
        <Skeleton className="h-10 w-full rounded-none border-b" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-9 w-full rounded-none border-b border-border/50 last:border-b-0"
          />
        ))}
      </div>
    </div>
  );
}

/** Tek arama satırı + tablo (Aşama metrikleri, Kullanıcı listesi, Bana haber ver) */
export function AdminSearchToolbarTableSkeleton({
  rows = 10,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-full max-w-[28rem] rounded-md" />
        <Skeleton className="h-8 w-[140px] rounded-md ml-auto" />
      </div>
      <div className="rounded-md border bg-card overflow-hidden">
        <Skeleton className="h-10 w-full rounded-none border-b" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-9 w-full rounded-none border-b border-border/50 last:border-b-0"
          />
        ))}
      </div>
    </div>
  );
}

/** Ödemeler / Teslimatlar: arama + sütunlar + Excel benzeri üst satır, tablo */
export function AdminOdemelerTeslimatSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full max-w-[28rem] rounded-md" />
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-8 w-[100px] rounded-md" />
          <Skeleton className="h-8 w-[120px] rounded-md" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <div className="rounded-md border bg-card overflow-hidden">
        <Skeleton className="h-10 w-full rounded-none border-b" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-9 w-full rounded-none border-b border-border/50 last:border-b-0"
          />
        ))}
      </div>
    </div>
  );
}

/** Uyumsuzluklar: sekme çubuğu + tablo */
export function AdminTabsTableSkeleton({
  tabCount = 2,
  rows = 8,
}: {
  tabCount?: number;
  rows?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: tabCount }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-40 rounded-md" />
        ))}
      </div>
      <AdminDataTablePageSkeleton rows={rows} />
    </div>
  );
}

/** Rezervasyonlar: istatistik kartları + tablo */
export function AdminReservationPageSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <AdminDataTablePageSkeleton rows={rows} />
    </div>
  );
}

/** Genel Bakış: özet kartları + grafik alanı */
export function AdminGenelBakisContentSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[152px] w-full rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-[min(420px,55vh)] w-full rounded-xl" />
      </div>
    </>
  );
}

/** Organizasyon ayarları: üst araç çubuğu + tablo */
export function AdminTenantSettingsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-full max-w-md rounded-md" />
        <Skeleton className="h-8 w-[100px] rounded-md" />
      </div>
      <div className="rounded-md border bg-card overflow-hidden">
        <Skeleton className="h-10 w-full rounded-none border-b" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-11 w-full rounded-none border-b border-border/50 last:border-b-0"
          />
        ))}
      </div>
    </div>
  );
}

/** Hissedar ayrıntı sayfası */
export function AdminShareholderDetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-36 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
    </div>
  );
}

/** Kullanıcı profili düzenleme */
export function AdminUserProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-9 w-56 max-w-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Skeleton className="h-20 w-20 rounded-full shrink-0" />
        <div className="space-y-4 flex-1 max-w-md">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/** Mail alıcı listesi diyaloğu */
export function AdminMailRecipientsListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-96 max-w-full sm:w-[28rem]" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
