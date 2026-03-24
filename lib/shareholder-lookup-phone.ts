/**
 * Hisse sorgula API’leri: telefonu `shareholders.phone_number` ile eşleşecek biçime çevirir (+90…).
 */
export function formatPhoneE164ForShareholderLookup(phone: string): string {
  let formattedPhone = phone.replace(/\D/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "+90" + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith("90")) {
    formattedPhone = "+90" + formattedPhone;
  } else if (!formattedPhone.startsWith("+")) {
    formattedPhone = "+" + formattedPhone;
  }
  return formattedPhone;
}
