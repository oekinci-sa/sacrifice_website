/**
 * Resend gönderen adresleri (sunucu + admin UI). resend paketini içe aktarmaz — istemci güvenli.
 */

export type AdminMailSenderKind = "bilgi" | "iletisim";

export const DEFAULT_BILGI_ANKARAKURBAN = "bilgi@ankarakurban.com.tr";
export const DEFAULT_ILETISIM_ANKARAKURBAN = "iletisim@ankarakurban.com.tr";
export const DEFAULT_BILGI_ELYAHAYVANCILIK = "bilgi@elyahayvancilik.com.tr";
export const DEFAULT_ILETISIM_ELYAHAYVANCILIK = "iletisim@elyahayvancilik.com.tr";

export const DISPLAY_ANKARA = "Ankara Kurban Bilgilendirme";
export const DISPLAY_ELYA = "Elya Hayvancılık Bilgilendirme";
/** Admin: iletisim@ kutusu seçildiğinde From görünen adı */
export const DISPLAY_ANKARA_ILETISIM = "Ankara Kurban İletişim";
export const DISPLAY_ELYA_ILETISIM = "Elya Hayvancılık İletişim";

/**
 * Admin arayüzünde gösterilecek varsayılan posta kutuları (env ile sunucuda override edilebilir).
 */
export function getAdminMailboxLabelsForLogoSlug(logoSlug: string): {
  bilgi: string;
  iletisim: string;
} {
  if (logoSlug === "elya-hayvancilik") {
    return {
      bilgi: DEFAULT_BILGI_ELYAHAYVANCILIK,
      iletisim: DEFAULT_ILETISIM_ELYAHAYVANCILIK,
    };
  }
  return {
    bilgi: DEFAULT_BILGI_ANKARAKURBAN,
    iletisim: DEFAULT_ILETISIM_ANKARAKURBAN,
  };
}
