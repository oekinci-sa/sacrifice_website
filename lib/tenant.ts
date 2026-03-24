import { headers } from "next/headers";

import { resolveTenantIdFromHost } from "@/lib/tenant-resolver";

/** Vercel vb.: x-forwarded-host virgülle birden fazla değer içerebilir. */
export function primaryHostFromHeaders(h: Headers): string {
  const forwarded = h.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return h.get("host") ?? "";
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
