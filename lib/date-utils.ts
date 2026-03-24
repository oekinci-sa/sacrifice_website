/**
 * Tarih gösterim utility'leri.
 * DB'den gelen tüm tarihler UTC'dir. Kullanıcıya Türkiye saatine göre gösterilir.
 * Bu dosyayı kullan; doğrudan format() veya toLocaleString() ile tarih gösterme.
 */

const APP_TIMEZONE = "Europe/Istanbul";

/**
 * Tarihi Türkiye saatine göre formatlar.
 * DB'den okunan veya API'den gelen ISO string / Date için kullan.
 */
export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (date == null) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("tr-TR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

/**
 * Tarih + saat + saniye (admin rezervasyonlar vb. hassas zaman gösterimi).
 */
export function formatDateWithSeconds(
  date: Date | string | null | undefined
): string {
  return formatDate(date, { second: "2-digit" });
}

/**
 * Kısa tarih (gg.aa.yyyy)
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (date == null) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * date-fns benzeri format: "dd MMM yyyy - HH:mm"
 */
export function formatDateMedium(date: Date | string | null | undefined): string {
  if (date == null) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(d);
}

/**
 * "dd MMMM yyyy - HH:mm" (ay adı uzun)
 */
export function formatDateLong(date: Date | string | null | undefined): string {
  if (date == null) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(d);
}

/**
 * Sadece "dd MMM yyyy" (grafik vb.)
 */
export function formatDateChart(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return formatter.format(d);
}

/**
 * Kısa grafik etiketi: "dd MMM" (yıl yok)
 */
export function formatDateChartShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
  });
  return formatter.format(d);
}
