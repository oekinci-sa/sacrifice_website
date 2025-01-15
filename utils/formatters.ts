// Format phone number for display (remove +9 prefix)
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return "";
  return phone.startsWith("+9") ? phone.slice(2) : phone;
};

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