import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";

/**
 * SMS şablon değişkenlerini hissedar + kurban + tenant ayarlarından doldurur.
 * Birincil kurban numarası değişkeni: kurban_no.
 */

export interface TenantSmsBranding {
  iban: string;
  deposit_amount: number;
  website_url: string | null;
}

export interface ShareholderVarSource {
  shareholder_name: string | null;
  phone_number: string | null;
  paid_amount: number | null;
  total_amount: number | null;
  remaining_payment: number | null;
  delivery_type: string | null;
  delivery_location: string | null;
  security_code: string | null;
  sacrifice: {
    sacrifice_no: number;
    sacrifice_time: string | null;
    planned_delivery_time?: string | null;
    ear_tag?: string | null;
  } | null;
}

function fmtTl(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return "";
  return (
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(n)) + " TL"
  );
}

function fmtDateTr(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR");
}

function fmtTimeTr(iso: string | null | undefined): string {
  if (!iso) return "";
  const trimmed = iso.trim();
  // PostgreSQL TIME: "HH:MM:SS" veya "HH:MM"
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const [h, m] = trimmed.split(":");
    return `${h}:${m}`;
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function fmtMinutes(minutes: number | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return "";
  return String(Math.round(minutes));
}

/**
 * Otomatik SMS için ek bağlam verisi.
 *
 * Ham ortalama süreler (dakika) ve tenant offset'leri buraya taşındı;
 * tahmini süreler (ortalama × offset) buildSmsVariablesFromShareholderRow içinde hesaplanır.
 */
export interface AutoSmsContext {
  /**
   * Az önce kesilmiş kurbanlığın sacrifice_no'su (kesim aşaması tetikleyicisi).
   * Yalnızca kesim SMS'lerinde doldurulur — {{kesilen_kurban_no}}
   */
  triggered_sacrifice_no?: number;
  /**
   * Az önce parçalanmış kurbanlığın sacrifice_no'su (parçalama aşaması tetikleyicisi).
   * {{parcalanan_kurban_no}}
   */
  parcalanan_sacrifice_no?: number;
  /**
   * Az önce teslim edilmiş kurbanlığın sacrifice_no'su (teslimat aşaması tetikleyicisi).
   * {{teslim_edilen_kurban_no}}
   */
  teslim_edilen_sacrifice_no?: number;
  /** Kesim aşaması ham ortalama süresi (dakika, stage_metrics'ten). */
  avg_slaughter_minutes?: number;
  /** Parçalama aşaması ham ortalama süresi (dakika, stage_metrics'ten). */
  avg_butcher_minutes?: number;
  /** Teslimat aşaması ham ortalama süresi (dakika). */
  avg_delivery_minutes?: number;
  /**
   * Gerçekleşmiş parçalama→teslimat ortalama bekleme süresi (dakika).
   * delivery_time(N) − butcher_time(N−1) ortalaması; varsa parcalama_tahmini_bekleme_suresi
   * için bu değer öncelikli kullanılır.
   */
  avg_parcalama_bekleme_minutes?: number;
  /** Kesim: kaç kurban öncesinde SMS gönderilsin (tenant.sms_slaughter_approach_offset). */
  slaughter_offset?: number;
  /** Parçalama: kaç kurban öncesinde SMS gönderilsin. */
  butcher_offset?: number;
  /** Teslimat: kaç kurban öncesinde SMS gönderilsin (tenant.sms_delivery_pickup_offset). */
  delivery_offset?: number;
}

/** Hissedar sorgu satırından (shareholders + sacrifice join) değişken map'i üretir. */
export function buildSmsVariablesFromShareholderRow(
  row: ShareholderVarSource,
  tenant: TenantSmsBranding,
  lookupBaseUrl: string,
  context?: AutoSmsContext
): Record<string, string> {
  const sac = row.sacrifice;
  const no = sac?.sacrifice_no;
  const kurbanNo = no != null && Number.isFinite(no) ? String(no) : "";

  const kupeNo = (sac?.ear_tag ?? "").trim();

  const lookupUrl = lookupBaseUrl.replace(/\/$/, "") + "/hissesorgula";
  const takipUrl = (tenant.website_url ?? lookupBaseUrl).replace(/\/$/, "") + "/takip";

  // Aşama tetikleyici kurban numaraları
  const kesilenNo =
    context?.triggered_sacrifice_no != null
      ? String(context.triggered_sacrifice_no)
      : "";
  const parcalananNo =
    context?.parcalanan_sacrifice_no != null
      ? String(context.parcalanan_sacrifice_no)
      : "";
  const teslimEdilenNo =
    context?.teslim_edilen_sacrifice_no != null
      ? String(context.teslim_edilen_sacrifice_no)
      : "";

  // Ham ortalama süreler
  const kesimOrt = fmtMinutes(context?.avg_slaughter_minutes);
  const parcalamaOrt = fmtMinutes(context?.avg_butcher_minutes);
  const teslimatOrt = fmtMinutes(context?.avg_delivery_minutes);

  // Tahmini bekleme süreleri: ham ortalama × offset
  const kesimTahmini = fmtMinutes(
    context?.avg_slaughter_minutes != null && context.slaughter_offset != null
      ? context.avg_slaughter_minutes * context.slaughter_offset
      : undefined
  );
  // Öncelik: gerçekleşmiş delivery_time(N) − butcher_time(N−1) ortalaması;
  // yoksa stage_metrics ortalaması × offset fallback
  const parcalamaTahminiRaw =
    context?.avg_parcalama_bekleme_minutes != null
      ? context.avg_parcalama_bekleme_minutes
      : context?.avg_butcher_minutes != null && context.butcher_offset != null
        ? context.avg_butcher_minutes * context.butcher_offset
        : undefined;
  const parcalamaTahmini = fmtMinutes(parcalamaTahminiRaw);
  const teslimatTahmini = fmtMinutes(
    context?.avg_delivery_minutes != null && context.delivery_offset != null
      ? context.avg_delivery_minutes * context.delivery_offset
      : undefined
  );

  return {
    // Hissedar
    ad_soyad: (row.shareholder_name ?? "").trim(),
    telefon: row.phone_number?.trim()
      ? formatPhoneForDisplayWithSpacing(row.phone_number)
      : "",
    kurban_no: kurbanNo,
    kupe_no: kupeNo,
    // Ödeme
    kalan_tutar: fmtTl(row.remaining_payment),
    odenen_tutar: fmtTl(row.paid_amount),
    toplam_tutar: fmtTl(row.total_amount),
    kapora_tutari: fmtTl(tenant.deposit_amount),
    // Zamanlama
    kesim_saati: sac?.sacrifice_time ? fmtTimeTr(sac.sacrifice_time) : "",
    kesim_tarihi: sac?.sacrifice_time ? fmtDateTr(sac.sacrifice_time) : "",
    // Teslimat
    teslimat_tercihi: (row.delivery_type ?? "").trim(),
    teslimat_adresi: (row.delivery_location ?? "").trim(),
    teslimat_saati: sac?.planned_delivery_time
      ? fmtTimeTr(sac.planned_delivery_time)
      : "",
    // Linkler
    sorgulama_linki: lookupUrl,
    takip_linki: takipUrl,
    // Diğer
    guvenlik_kodu: (row.security_code ?? "").trim(),
    iban: (tenant.iban ?? "").trim(),
    // Otomatik SMS — aşama tetikleyici kurban numaraları
    kesilen_kurban_no: kesilenNo,
    parcalanan_kurban_no: parcalananNo,
    teslim_edilen_kurban_no: teslimEdilenNo,
    // Otomatik SMS — aşama süreleri (ham ortalama, dakika / kurban başına)
    kesim_ortalama_suresi: kesimOrt,
    parcalama_ortalama_suresi: parcalamaOrt,
    teslimat_ortalama_suresi: teslimatOrt,
    // Otomatik SMS — tahmini bekleme (ortalama × offset, dakika)
    kesim_tahmini_bekleme_suresi: kesimTahmini,
    parcalama_tahmini_bekleme_suresi: parcalamaTahmini,
    teslimat_tahmini_bekleme_suresi: teslimatTahmini,
    // Geriye dönük uyum alias'ları (eski şablon değişken adları)
    kesim_tahmini_sure: kesimTahmini,
    parcalama_tahmini_sure: parcalamaTahmini,
    teslimat_tahmini_sure: teslimatTahmini,
  };
}
