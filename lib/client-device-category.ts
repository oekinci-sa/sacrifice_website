/**
 * Tarayıcıda rezervasyon kaydı için cihaz sınıfı (iş analitiği).
 * Sunucu tarafında veya SSR'da her zaman `unknown` döner.
 */
export const CLIENT_DEVICE_CATEGORIES = [
  "mobile",
  "tablet",
  "desktop",
  "unknown",
] as const;

export type ClientDeviceCategory = (typeof CLIENT_DEVICE_CATEGORIES)[number];

export function isClientDeviceCategory(
  value: unknown
): value is ClientDeviceCategory {
  return (
    typeof value === "string" &&
    (CLIENT_DEVICE_CATEGORIES as readonly string[]).includes(value)
  );
}

export function getClientDeviceCategory(): ClientDeviceCategory {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "unknown";
  }

  const ua = navigator.userAgent;
  const uaLower = ua.toLowerCase();
  const w = window.innerWidth;
  const tp = navigator.maxTouchPoints ?? 0;
  const coarsePointer =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const touch = tp > 0 || coarsePointer;

  const isIPad =
    /ipad/i.test(ua) || (navigator.platform === "MacIntel" && tp > 1);
  if (isIPad) return "tablet";

  const isAndroidTablet = /android/i.test(ua) && !/mobile/i.test(uaLower);
  if (isAndroidTablet) return "tablet";

  if (/tablet|playbook|silk|kindle/i.test(uaLower)) return "tablet";

  const isPhoneUA =
    /iphone|ipod|android.*mobile|iemobile|opera mini|blackberry/i.test(
      uaLower
    );
  if (isPhoneUA) return "mobile";

  if (w <= 768 && touch) return "mobile";
  if (w > 768 && w <= 1024 && touch) return "tablet";

  return "desktop";
}

export function clientDeviceCategoryLabel(
  category: ClientDeviceCategory | string | null | undefined
): string {
  switch (category) {
    case "mobile":
      return "Mobil";
    case "tablet":
      return "Tablet";
    case "desktop":
      return "Masaüstü";
    case "unknown":
    default:
      return "Bilinmeyen";
  }
}
