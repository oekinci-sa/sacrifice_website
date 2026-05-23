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
  const d = new Date(iso);
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
  /** Şu an kesilen/işlenen kurbanlığın sacrifice_no'su (hedef değil, tetikleyici). */
  triggered_sacrifice_no?: number;
  /** Kesim aşaması ham ortalama süresi (dakika, stage_metrics'ten). */
  avg_slaughter_minutes?: number;
  /** Parçalama aşaması ham ortalama süresi (dakika). */
  avg_butcher_minutes?: number;
  /** Teslimat aşaması ham ortalama süresi (dakika). */
  avg_delivery_minutes?: number;
  /** Kesim: kaç kurban öncesinde SMS gönderilsin (tenant.sms_slaughter_approach_offset). */
  slaughter_offset?: number;
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

  const kesilenNo =
    context?.triggered_sacrifice_no != null
      ? String(context.triggered_sacrifice_no)
      : "";

  // Aşama bazlı tahmini süreler: ham ortalama × tenant offset
  const kesimOrt = fmtMinutes(context?.avg_slaughter_minutes);
  const kesimTahmini = fmtMinutes(
    context?.avg_slaughter_minutes != null && context.slaughter_offset != null
      ? context.avg_slaughter_minutes * context.slaughter_offset
      : undefined
  );

  const parcalamaOrt = fmtMinutes(context?.avg_butcher_minutes);
  // Parçalama için tenant offset şu an yok; ham ortalama = tahmini süre
  const parcalamaTahmini = parcalamaOrt;

  const teslimatOrt = fmtMinutes(context?.avg_delivery_minutes);
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
    // Linkler
    sorgulama_linki: lookupUrl,
    takip_linki: takipUrl,
    // Diğer
    guvenlik_kodu: (row.security_code ?? "").trim(),
    iban: (tenant.iban ?? "").trim(),
    // Otomatik SMS — tetikleyici kurban
    kesilen_kurban_no: kesilenNo,
    // Otomatik SMS — aşama süreleri (ham ortalama, dakika)
    kesim_ortalama_suresi: kesimOrt,
    parcalama_ortalama_suresi: parcalamaOrt,
    teslimat_ortalama_suresi: teslimatOrt,
    // Otomatik SMS — tahmini bekleme (ortalama × tenant offset, dakika)
    kesim_tahmini_sure: kesimTahmini,
    parcalama_tahmini_sure: parcalamaTahmini,
    teslimat_tahmini_sure: teslimatTahmini,
  };
}
