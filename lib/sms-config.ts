import {
  GOLBASI_TENANT_ID,
  KAHRAMANKAZAN_TENANT_ID,
  TEST_TENANT_ID,
} from "@/lib/tenant-resolver";

export interface SmsCredentials {
  username: string;
  password: string;
  originator: string;
  apiBase: string;
}

function resolveApiBase(override?: string): string {
  return (
    override?.trim() ||
    process.env.BIZIM_SMS_API_BASE?.trim() ||
    "https://api.sms.bizimsms.mobi"
  );
}

function buildCredentials(
  username: string | undefined,
  password: string | undefined,
  originator: string | undefined,
  apiBaseOverride?: string
): SmsCredentials | null {
  const apiBase = resolveApiBase(apiBaseOverride);
  if (!username || !password || !originator) return null;
  return { username, password, originator, apiBase };
}

/**
 * Tenant'a göre Bizim SMS API kimlik bilgilerini döner.
 */
export function getSmsCredentials(tenantId: string): SmsCredentials | null {
  if (tenantId === KAHRAMANKAZAN_TENANT_ID || tenantId === TEST_TENANT_ID) {
    return buildCredentials(
      process.env.BIZIM_SMS_USERNAME?.trim(),
      process.env.ANKARA_KURBAN_BIZIM_SMS_API_SECRET?.trim(),
      process.env.BIZIM_SMS_ORIGINATOR?.trim()
    );
  }

  if (tenantId === GOLBASI_TENANT_ID) {
    return buildCredentials(
      process.env.ELYAHAYVANCILIK_BIZIM_SMS_USERNAME?.trim(),
      process.env.ELYAHAYVANCILIK_BIZIM_SMS_API_SECRET?.trim(),
      process.env.ELYAHAYVANCILIK_BIZIM_SMS_ORIGINATOR?.trim() || "ELYA HYVNCL"
    );
  }

  return null;
}

/** SMS modülünün açık olduğu tenant ID'leri. */
export const SMS_ENABLED_TENANT_IDS: string[] = [
  KAHRAMANKAZAN_TENANT_ID,
  TEST_TENANT_ID,
  GOLBASI_TENANT_ID,
];
