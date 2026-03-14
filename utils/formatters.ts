// Format phone number for database (Türkiye: her zaman +90 formatı)
export const formatPhoneForDB = (phone: string): string => {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "";
  // 0 ile başlıyorsa kaldır (05555555555 -> 5555555555)
  const normalized = digits.startsWith("0") ? digits.slice(1) : digits;
  // 90 ile başlıyorsa + ekle, değilse +90 ekle
  if (normalized.startsWith("90") && normalized.length >= 12) {
    return `+${normalized}`;
  }
  return `+90${normalized}`;
};

// Format phone number for display with spacing (0555 555 55 55)
export const formatPhoneForDisplayWithSpacing = (phone: string): string => {
  if (!phone) return "-";

  // Convert from +905555555555 to 05555555555 format first
  const phoneFormatted = phone.startsWith("+9")
    ? `0${phone.substring(3)}`
    : phone;

  // Apply spacing: 0555 555 55 55
  return phoneFormatted.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
}; 