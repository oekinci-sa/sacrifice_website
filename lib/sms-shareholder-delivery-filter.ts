/**
 * Hissedar `delivery_type` alanı (hisse formu; örn. Kesimhane, Ulus, Adrese teslim).
 * @see lib/delivery-options.ts
 */
export function isSlaughterhouseDeliveryType(
  deliveryType: string | null | undefined
): boolean {
  const t = (deliveryType ?? "").trim().toLocaleLowerCase("tr");
  return t === "kesimhane";
}
