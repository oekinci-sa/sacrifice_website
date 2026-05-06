import { KAHRAMANKAZAN_TENANT_ID } from "@/lib/tenant-resolver";

export interface SmsCredentials {
  username: string;
  password: string;
  originator: string;
  apiBase: string;
}

/**
 * Tenant'a göre Bizim SMS API kimlik bilgilerini döner.
 * Şu an yalnızca Ankara Kurban (KAHRAMANKAZAN) destekleniyor.
 * İleride GOLBASI_TENANT_ID için de eklenebilir.
 */
export function getSmsCredentials(tenantId: string): SmsCredentials | null {
  if (tenantId === KAHRAMANKAZAN_TENANT_ID) {
    const username = process.env.BIZIM_SMS_USERNAME?.trim();
    const password = process.env.ANKARA_KURBAN_BIZIM_SMS_API_SECRET?.trim();
    const originator = process.env.BIZIM_SMS_ORIGINATOR?.trim();
    const apiBase =
      process.env.BIZIM_SMS_API_BASE?.trim() ||
      "https://api.sms.bizimsms.mobi";

    if (!username || !password || !originator) return null;
    return { username, password, originator, apiBase };
  }
  return null;
}

/** SMS modülünün açık olduğu tenant ID'leri. */
export const SMS_ENABLED_TENANT_IDS: string[] = [KAHRAMANKAZAN_TENANT_ID];
