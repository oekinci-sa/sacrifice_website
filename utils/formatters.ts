// Format phone number for database (ensure +9 prefix)
export const formatPhoneForDB = (phone: string): string => {
  if (!phone) return "";
  const cleanPhone = phone.replace(/\D/g, ""); // Remove non-digits
  if (cleanPhone.startsWith("9")) {
    return `+${cleanPhone}`;
  }
  if (cleanPhone.startsWith("0")) {
    return `+9${cleanPhone}`;
  }
  return `+90${cleanPhone}`;
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