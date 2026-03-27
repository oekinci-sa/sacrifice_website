import { headers } from "next/headers";

import { resolveTenantIdFromHost } from "@/lib/tenant-resolver";

/**
 * İstek hostname'i (middleware `req.headers.get("host")` ile uyumlu).
 * Vercel'de `x-forwarded-host` virgülle birden fazla değer içerebilir ve ilk segment
 * bazen `*.vercel.app` olur; o zaman `Host` özel alan adı iken yanlış tenant çözülür
 * (ör. Toplam Satılan Hisse: 0). Önce `Host`, sonra forwarded parçaları; tenant map'e
 * uyan ilk aday kullanılır.
 */
export function primaryHostFromHeaders(h: Headers): string {
  const directHost = h.get("host")?.trim() ?? "";
  const forwardedRaw = h.get("x-forwarded-host");
  const candidates: string[] = [];
  if (directHost) candidates.push(directHost);
  if (forwardedRaw) {
    for (const p of forwardedRaw.split(",")) {
      const t = p.trim();
      if (t && !candidates.includes(t)) candidates.push(t);
    }
  }

  for (const c of candidates) {
    if (resolveTenantIdFromHost(c)) return c;
  }

  const nonVercel = candidates.find((c) => !c.includes(".vercel.app"));
  if (nonVercel) return nonVercel;

  return candidates[0] ?? "";
}

/**
 * Route Handler'da tercihen `request.headers` ile çağırın (middleware `x-tenant-id` ile uyumlu).
 */
export function getTenantIdFromHeaders(h: Headers): string {
  const fromMiddleware = h.get("x-tenant-id");
  if (fromMiddleware) return fromMiddleware;

  const host = primaryHostFromHeaders(h);
  const resolved = resolveTenantIdFromHost(host);
  if (resolved) return resolved;

  throw new Error(
    "tenant_id bulunamadı. Hostname tenant ile eşleşmiyor olabilir."
  );
}

export function getTenantIdOptionalFromHeaders(h: Headers): string | null {
  const fromMiddleware = h.get("x-tenant-id");
  if (fromMiddleware) return fromMiddleware;
  const host = primaryHostFromHeaders(h);
  return resolveTenantIdFromHost(host);
}

/**
 * Önce middleware'in `x-tenant-id` değeri; yoksa `Host` / `x-forwarded-host` ile çözümleme.
 * (Production'da bazı isteklerde middleware header'ı Route Handler'a iletilmeyebilir — Vercel.)
 */
export function getTenantId(): string {
  return getTenantIdFromHeaders(headers());
}

/**
 * Tenant ID'yi optional döndürür. Bazı route'larda (örn. health check) gerekmez.
 */
export function getTenantIdOptional(): string | null {
  return getTenantIdOptionalFromHeaders(headers());
}
