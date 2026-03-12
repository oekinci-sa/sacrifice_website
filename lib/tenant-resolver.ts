/**
 * Hostname (ve port) üzerinden tenant_id çözümler.
 * TENANT_MAP env: {"localhost:3000":"uuid","localhost:3001":"uuid"} veya subdomain
 * Port bazlı: localhost:3000→golbasi, 3001→kahramankazan, 3002→golbasi (test)
 * Subdomain: golbasi.localhost, kahramankazan.localhost (production)
 */
const GOLBASI_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const KAHRAMANKAZAN_TENANT_ID = "00000000-0000-0000-0000-000000000002";

export function resolveTenantIdFromHost(host: string): string | null {
  const tenantMapRaw = process.env.TENANT_MAP;
  if (tenantMapRaw) {
    try {
      const map = JSON.parse(tenantMapRaw) as Record<string, string>;
      const tenantId = map[host] ?? map[host.split(":")[0]];
      if (tenantId) return tenantId;
    } catch {
      // parse hatası
    }
  }

  // Port bazlı (local dev - Google OAuth localhost kabul eder)
  const portMap: Record<string, string> = {
    "localhost:3000": GOLBASI_TENANT_ID,
    "localhost:3001": KAHRAMANKAZAN_TENANT_ID,
    "localhost:3002": GOLBASI_TENANT_ID, // test portu → golbasi
    "127.0.0.1:3000": GOLBASI_TENANT_ID,
    "127.0.0.1:3001": KAHRAMANKAZAN_TENANT_ID,
    "127.0.0.1:3002": GOLBASI_TENANT_ID,
  };

  // Subdomain (production: golbasi.example.com vb.)
  const subdomainMap: Record<string, string> = {
    "golbasi.localhost": GOLBASI_TENANT_ID,
    "kahramankazan.localhost": KAHRAMANKAZAN_TENANT_ID,
  };

  // Portsuz fallback (localhost veya 127.0.0.1 → golbasi)
  const fallbackMap: Record<string, string> = {
    localhost: GOLBASI_TENANT_ID,
    "127.0.0.1": GOLBASI_TENANT_ID,
  };

  const hostWithoutPort = host.split(":")[0];
  return (
    portMap[host] ??
    subdomainMap[host] ??
    subdomainMap[hostWithoutPort] ?? // kahramankazan.localhost:3001 → hostWithoutPort ile eşleşir
    fallbackMap[hostWithoutPort] ??
    null
  );
}
