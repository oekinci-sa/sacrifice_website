/**
 * E-posta <img src="..."> için mutlak URL.
 *
 * Şu an her zaman boş döner → çağıran `logoBase64.ts`'deki **inline base64 PNG**
 * fallback'i kullanır. Nedenleri:
 *  - E-posta istemcileri (Gmail, Outlook, Yahoo) **SVG desteklemez**; SVG URL
 *    verildiğinde logo yerine alt text görünür.
 *  - Harici URL'ler bazı istemcilerde güvenlik uyarısı tetikler veya proxy'lenir.
 *  - Inline base64 PNG tüm büyük istemcilerde güvenilir şekilde çalışır.
 *
 * İleride public'e PNG logo eklenirse bu fonksiyon yeniden etkinleştirilebilir.
 */
export function getLogoAbsoluteUrlForEmail(_logoSlug: string): string {
  return "";
}
