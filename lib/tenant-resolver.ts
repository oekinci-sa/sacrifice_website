/**
 * Hostname (ve port) üzerinden tenant_id çözümler.
 * Port: 3000=test, 3001=kahramankazan, 3002=golbasi
 * Production: ankarakurban.com.tr→3001, elyahayvancilik.com.tr→3002
 * ID: 01=test, 02=kahramankazan, 03=golbasi
 */
const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const KAHRAMANKAZAN_TENANT_ID = "00000000-0000-0000-0000-000000000002";
const GOLBASI_TENANT_ID = "00000000-0000-0000-0000-000000000003";

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

  // Port bazlı: 3000=test, 3001=kahramankazan, 3002=golbasi
  const portMap: Record<string, string> = {
    "localhost:3000": TEST_TENANT_ID,
    "localhost:3001": KAHRAMANKAZAN_TENANT_ID,
    "localhost:3002": GOLBASI_TENANT_ID,
    "127.0.0.1:3000": TEST_TENANT_ID,
    "127.0.0.1:3001": KAHRAMANKAZAN_TENANT_ID,
    "127.0.0.1:3002": GOLBASI_TENANT_ID,
  };

  // Subdomain (local)
  const subdomainMap: Record<string, string> = {
    "test.localhost": TEST_TENANT_ID,
    "golbasi.localhost": GOLBASI_TENANT_ID,
    "kahramankazan.localhost": KAHRAMANKAZAN_TENANT_ID,
  };

  // Production domain'ler (3000=test/Vercel, 3001=ankarakurban, 3002=elyahayvancilik)
  const productionDomainMap: Record<string, string> = {
    "sacrifice-website-e64spmeri-solutions-projects-803fd257.vercel.app": TEST_TENANT_ID,
    "ankarakurban.com.tr": KAHRAMANKAZAN_TENANT_ID,
    "www.ankarakurban.com.tr": KAHRAMANKAZAN_TENANT_ID,
    "ankarakurban.com": KAHRAMANKAZAN_TENANT_ID,
    "www.ankarakurban.com": KAHRAMANKAZAN_TENANT_ID,
    "elyahayvancilik.com.tr": GOLBASI_TENANT_ID,
    "www.elyahayvancilik.com.tr": GOLBASI_TENANT_ID,
    "elyahayvancilik.com": GOLBASI_TENANT_ID,
    "www.elyahayvancilik.com": GOLBASI_TENANT_ID,
  };

  // Portsuz fallback → test
  const fallbackMap: Record<string, string> = {
    localhost: TEST_TENANT_ID,
    "127.0.0.1": TEST_TENANT_ID,
  };

  const hostWithoutPort = host.split(":")[0];
  return (
    portMap[host] ??
    subdomainMap[host] ??
    subdomainMap[hostWithoutPort] ??
    productionDomainMap[hostWithoutPort] ??
    fallbackMap[hostWithoutPort] ??
    null
  );
}
