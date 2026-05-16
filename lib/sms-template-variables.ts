/**
 * SMS şablon değişkenlerini hissedar + kurban + tenant ayarlarından doldurur.
 * SmsEditor ile uyumlu anahtarlar: ad_soyad, telefon, hayvan_no, ...
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

/** Hissedar sorgu satırından (shareholders + sacrifice join) değişken map'i üretir. */
export function buildSmsVariablesFromShareholderRow(
  row: ShareholderVarSource,
  tenant: TenantSmsBranding,
  lookupBaseUrl: string
): Record<string, string> {
  const sac = row.sacrifice;
  const no = sac?.sacrifice_no;
  const hayvanNo = no != null && Number.isFinite(no) ? String(no) : "";

  const kupeNo = (sac?.ear_tag ?? "").trim();

  const lookupUrl = lookupBaseUrl.replace(/\/$/, "") + "/hissesorgula";

  return {
    ad_soyad: (row.shareholder_name ?? "").trim(),
    telefon: (row.phone_number ?? "").trim(),
    hayvan_no: hayvanNo,
    kurban_no: hayvanNo,
    kupe_no: kupeNo,
    kalan_tutar: fmtTl(row.remaining_payment),
    odenen_tutar: fmtTl(row.paid_amount),
    toplam_tutar: fmtTl(row.total_amount),
    kapora_tutari: fmtTl(tenant.deposit_amount),
    kesim_saati: sac?.sacrifice_time ? fmtTimeTr(sac.sacrifice_time) : "",
    kesim_tarihi: sac?.sacrifice_time ? fmtDateTr(sac.sacrifice_time) : "",
    teslimat_tercihi: (row.delivery_type ?? "").trim(),
    teslimat_adresi: (row.delivery_location ?? "").trim(),
    sorgulama_linki: lookupUrl,
    guvenlik_kodu: (row.security_code ?? "").trim(),
    iban: (tenant.iban ?? "").trim(),
  };
}
