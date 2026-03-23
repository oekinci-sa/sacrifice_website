/**
 * Tenant'a göre teslimat seçenekleri ve ücretleri.
 * Elya Hayvancılık: Kesimhane (Gölbaşı), Adrese teslim 1500 TL
 * Ankara Kurban: Kesimhane (Kahramankazan), Teslimat Noktası Ulus 1500 TL
 */
export interface DeliveryOption {
  label: string;
  value: string;
  fee: number;
}

/**
 * Hisse al / hisse sorgula kurbanlık tablolarında "Teslim Saati" (planlı teslim) sütunu.
 * Elya Hayvancılık tenant'ında gösterilmez; Ankara Kurban vb. tenant'larda gösterilir.
 */
export function showPlannedTeslimSaatiOnPublicPages(logoSlug: string): boolean {
  return logoSlug !== "elya-hayvancilik";
}

/** Form seçenekleri - value kullanıcı seçimini temsil eder (Kesimhane, Adrese teslim, Ulus) */
export function getDeliveryOptions(logoSlug: string): DeliveryOption[] {
  if (logoSlug === "elya-hayvancilik") {
    return [
      { label: "Kesimhane", value: "Kesimhane", fee: 0 },
      { label: "Adrese Teslim (+1500 TL)", value: "Adrese teslim", fee: 1500 },
    ];
  }
  return [
    { label: "Kesimhane", value: "Kesimhane", fee: 0 },
    { label: "Teslimat Noktası - Ulus (+1500 TL)", value: "Ulus", fee: 1500 },
  ];
}

/** delivery_location değerine göre ücret (Gölbaşı, Kahramankazan, Ulus veya adres metni) */
export function getDeliveryFeeForLocation(logoSlug: string, deliveryLocation: string): number {
  if (!deliveryLocation) return 0;
  if (deliveryLocation === "Gölbaşı" || deliveryLocation === "Kahramankazan") return 0;
  if (deliveryLocation === "Ulus") return 1500;
  if (deliveryLocation === "-") return logoSlug === "elya-hayvancilik" ? 1500 : 0; // Adrese teslim placeholder
  if (logoSlug === "elya-hayvancilik" && deliveryLocation !== "Gölbaşı") return 1500; // Adres metni
  return 0;
}

/** delivery_type değerine göre ücret (API/trigger için) */
export function getDeliveryFeeForType(logoSlug: string, deliveryType: string): number {
  if (!deliveryType || deliveryType === "Kesimhane") return 0;
  if (deliveryType === "Ulus") return 1500;
  if (deliveryType === "Adrese teslim") return logoSlug === "elya-hayvancilik" ? 1500 : 0;
  return 0;
}

/** Gösterim etiketi - eski değerler (Kesimhane, Adrese teslim) backward compat */
export function getDeliveryDisplayLabel(logoSlug: string, deliveryLocation: string): string {
  if (!deliveryLocation) return "Belirtilmemiş";
  if (deliveryLocation === "Gölbaşı" || deliveryLocation === "Kahramankazan") return "Kesimhane";
  if (deliveryLocation === "Ulus") return "Teslimat Noktası - Ulus (+1500 TL)";
  if (logoSlug === "elya-hayvancilik" && deliveryLocation !== "Gölbaşı") return `Adrese Teslim: ${deliveryLocation}`;
  if (deliveryLocation === "Kesimhane") return "Kesimhane"; // legacy
  if (deliveryLocation === "Adrese teslim") return "Adrese Teslim (+1500 TL)"; // legacy
  return deliveryLocation;
}

/**
 * Kullanıcı seçiminden delivery_location hesapla.
 * @param logoSlug - tenant logo_slug
 * @param selection - form seçimi: "Kesimhane" | "Adrese teslim" | "Ulus"
 * @param addressText - Adrese teslim seçildiğinde kullanıcının yazdığı adres
 */
export function getDeliveryLocationFromSelection(
  logoSlug: string,
  selection: string,
  addressText?: string
): string {
  if (logoSlug === "elya-hayvancilik") {
    if (selection === "Kesimhane") return "Gölbaşı";
    if (selection === "Adrese teslim") return (addressText || "").trim() || "-";
    return selection;
  }
  if (selection === "Kesimhane") return "Kahramankazan";
  if (selection === "Ulus") return "Ulus";
  if (selection === "Adrese teslim") return (addressText || "").trim() || "-";
  return selection;
}

/**
 * delivery_type için gösterim etiketi.
 * @param includeFee - true sadece hisse al formunda (seçim yaparken). Tablo, onay, PDF'de false.
 */
export function getDeliveryTypeDisplayLabel(
  logoSlug: string,
  deliveryType: string,
  _deliveryLocation?: string | null,
  includeFee = false
): string {
  if (!deliveryType) return "Belirtilmemiş";
  if (deliveryType === "Kesimhane") return "Kesimhane";
  if (deliveryType === "Ulus") return includeFee ? "Teslimat Noktası - Ulus (+1500 TL)" : "Teslimat Noktası - Ulus";
  if (deliveryType === "Adrese teslim") return includeFee ? "Adrese Teslim (+1500 TL)" : "Adrese Teslim";
  return deliveryType;
}

/** Tenant'ın Adrese teslim seçeneği var mı */
export function hasAdreseTeslimOption(logoSlug: string): boolean {
  return getDeliveryOptions(logoSlug).some((o) => o.value === "Adrese teslim");
}

/** delivery_location → Select value (form gösterimi için) */
export function getDeliverySelectionFromLocation(logoSlug: string, deliveryLocation: string): string {
  if (!deliveryLocation) return "Kesimhane";
  if (deliveryLocation === "-") return "Adrese teslim"; // placeholder: Adrese teslim seçili, adres henüz girilmedi
  if (deliveryLocation === "Kesimhane") return "Kesimhane"; // legacy / initial
  if (deliveryLocation === "Gölbaşı" || deliveryLocation === "Kahramankazan") return "Kesimhane";
  if (deliveryLocation === "Ulus") return "Ulus";
  if (logoSlug === "elya-hayvancilik") return "Adrese teslim"; // adres metni veya legacy "Adrese teslim"
  return "Kesimhane";
}
