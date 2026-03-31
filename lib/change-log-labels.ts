/**
 * change_logs: DB'de İngilizce tablo/kolon kodları; arayüzde Türkçe etiketler.
 * Alan etiketleri (COLUMN_LABEL_TR), tetikleyicilerdeki kısa `description` kökleriyle uyumludur;
 * referans: `.project-architecture/db/tables/change_logs/short_descriptions_reference.md`
 */

/** Eski trigger'ların yazdığı Türkçe table_name → canonical kod */
export const LEGACY_TABLE_NAME_TO_CODE: Record<string, string> = {
  Kurbanlıklar: "sacrifice_animals",
  Hissedarlar: "shareholders",
  "Hisse Uyumsuzluğu": "mismatched_share_acknowledgments",
  Kullanıcılar: "users",
  "Aşama Metrikleri": "stage_metrics",
};

export const TABLE_LABEL_TR: Record<string, string> = {
  sacrifice_animals: "Kurbanlıklar",
  shareholders: "Hissedarlar",
  mismatched_share_acknowledgments: "Hisse uyumsuzluğu",
  users: "Kullanıcılar",
  user_tenants: "Kullanıcı–organizasyon",
  stage_metrics: "Aşama metrikleri",
};

const STAGE_ROW_LABEL_TR: Record<string, string> = {
  slaughter_stage: "Kesim",
  butcher_stage: "Parçalama",
  delivery_stage: "Teslimat",
};

/** Satır kimliği UUID doğrulama (change_logs row_id, API eşleştirme) */
export const CHANGE_LOG_ROW_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const UUID_RE = CHANGE_LOG_ROW_UUID_RE;

/** Kolon kodları (snake_case) → Türkçe etiket; tablo bazlı */
const COLUMN_LABEL_TR: Record<string, Record<string, string>> = {
  sacrifice_animals: {
    sacrifice_no: "Kurban numarası",
    share_weight: "Hisse ağırlığı",
    share_price: "Hisse bedeli",
    empty_share: "Boş hisse",
    pricing_mode: "Fiyatlama modu",
    live_scale_total_kg: "Baskül ağırlığı",
    live_scale_total_price: "Baskül tutarı",
    notes: "Notlar",
    animal_type: "Hayvan cinsi",
    foundation: "Vakıf bilgisi",
    ear_tag: "Küpe numarası",
    barn_stall_order_no: "Padok no",
    sacrifice_time: "Kesim planı",
    planned_delivery_time: "Planlı teslim saati",
    slaughter_time: "Kesim saati",
    butcher_time: "Parçalama saati",
    delivery_time: "Teslimat saati",
  },
  shareholders: {
    shareholder_name: "Hissedar adı",
    phone_number: "Telefon",
    second_phone_number: "İkinci telefon",
    total_amount: "Toplam tutar",
    paid_amount: "Ödenen tutar",
    remaining_payment: "Kalan ödeme",
    delivery_fee: "Teslimat ücreti",
    delivery_location: "Teslimat noktası",
    delivery_type: "Teslimat tipi",
    sacrifice_consent: "Vekalet durumu",
    notes: "Not",
    email: "E-posta",
    security_code: "Güvenlik kodu",
    contacted_at: "Görüşme durumu",
  },
  users: {
    name: "Ad",
    image: "Profil görseli",
    role: "Rol",
    email: "E-posta",
    status: "Durum",
  },
  stage_metrics: {
    current_sacrifice_number: "Sıra",
  },
};

function isEnglishColumnCode(s: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(s);
}

export function normalizeTableCode(raw: string | null | undefined): string {
  if (raw == null || raw === "") return "";
  return LEGACY_TABLE_NAME_TO_CODE[raw] ?? raw;
}

export function getTableLabelTr(tableName: string | null | undefined): string {
  if (!tableName) return "-";
  const code = normalizeTableCode(tableName);
  return TABLE_LABEL_TR[code] ?? tableName;
}

export type ChangeTypeCode = "INSERT" | "UPDATE" | "DELETE";

/** DB'de İngilizce; eski Türkçe satırlar için geriye dönük */
export function normalizeChangeType(raw: string | null | undefined): ChangeTypeCode {
  const s = (raw ?? "").trim();
  if (s === "INSERT" || s === "Ekleme") return "INSERT";
  if (s === "UPDATE" || s === "Güncelleme") return "UPDATE";
  if (s === "DELETE" || s === "Silme") return "DELETE";
  return "UPDATE";
}

export function formatChangeTypeTr(raw: string | null | undefined): string {
  if (raw == null || raw === "") return "-";
  const c = normalizeChangeType(raw);
  const map: Record<ChangeTypeCode, string> = {
    INSERT: "Ekleme",
    UPDATE: "Güncelleme",
    DELETE: "Silme",
  };
  return map[c] ?? raw;
}

export function getColumnLabelTr(
  tableName: string | null | undefined,
  columnName: string | null | undefined
): string {
  if (!columnName) return "-";
  const t = normalizeTableCode(tableName ?? "");
  if (isEnglishColumnCode(columnName)) {
    return COLUMN_LABEL_TR[t]?.[columnName] ?? columnName;
  }
  return columnName;
}

/**
 * Satır kimliğinin tabloya göre kısa/okunabilir gösterimi (UI).
 * `rowIdLabel`: API’nin sacrifice_id → sıra no eşlemesi (Kurbanlıklar / uyumsuzluk).
 * Kurbanlıklar: `row_id` sacrifice_id (UUID); eski silinmiş kayıtlar için sıra no kalabilir.
 * Hissedar / kullanıcı: yalnızca UUID (ve eski "Ad (uuid)" satırları için geriye dönük).
 */
export function formatRowIdDisplay(
  tableName: string | null | undefined,
  rowId: string,
  rowIdLabel?: string | null
): string {
  if (rowIdLabel != null && rowIdLabel.trim() !== "") return rowIdLabel.trim();
  if (!rowId) return "-";
  const t = normalizeTableCode(tableName ?? "");

  if (t === "sacrifice_animals" || t === "mismatched_share_acknowledgments") {
    const trimmed = rowId.trim();
    if (UUID_RE.test(trimmed)) return trimmed;
    const n = parseInt(rowId, 10);
    if (!Number.isNaN(n)) return `Sıra #${n}`;
  }

  if (t === "shareholders" || t === "users" || t === "user_tenants") {
    const trimmed = rowId.trim();
    if (UUID_RE.test(trimmed)) return trimmed;
    const parenIdx = rowId.lastIndexOf("(");
    if (parenIdx > 0) return rowId.slice(0, parenIdx).trim();
    return rowId;
  }

  if (t === "stage_metrics") {
    return STAGE_ROW_LABEL_TR[rowId] ?? rowId;
  }

  return rowId;
}

/** Filtre / arama: hem kod hem Türkçe tablo adı ile eşleşsin */
export function tableNameMatchesFilter(
  rowTableName: string,
  selectedCodes: string[]
): boolean {
  if (selectedCodes.length === 0) return true;
  const code = normalizeTableCode(rowTableName);
  return selectedCodes.includes(code);
}
