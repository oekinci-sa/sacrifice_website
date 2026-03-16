/**
 * Tenant'a göre teslimat seçenekleri ve ücretleri.
 * Elya Hayvancılık: Adrese teslim 1500 TL
 * Diğerleri: Ulus 750 TL
 */
export interface DeliveryOption {
  label: string;
  value: string;
  fee: number;
}

export function getDeliveryOptions(logoSlug: string): DeliveryOption[] {
  if (logoSlug === "elya-hayvancilik") {
    return [
      { label: "Kesimhane", value: "Kesimhane", fee: 0 },
      { label: "Adrese teslim (+1500 TL)", value: "Adrese teslim", fee: 1500 },
    ];
  }
  return [
    { label: "Kesimhane", value: "Kesimhane", fee: 0 },
    { label: "Ulus (+750 TL)", value: "Ulus", fee: 750 },
  ];
}

export function getDeliveryFeeForLocation(logoSlug: string, deliveryLocation: string): number {
  if (deliveryLocation === "Kesimhane") return 0;
  if (logoSlug === "elya-hayvancilik" && deliveryLocation === "Adrese teslim") return 1500;
  if (deliveryLocation === "Ulus") return 750;
  return 0;
}

export function getDeliveryDisplayLabel(logoSlug: string, deliveryLocation: string): string {
  if (deliveryLocation === "Kesimhane") return "Kesimhane";
  if (logoSlug === "elya-hayvancilik" && deliveryLocation === "Adrese teslim") return "Adrese teslim (+1500 TL)";
  if (deliveryLocation === "Ulus") return "Ulus (+750 TL)";
  return deliveryLocation;
}
