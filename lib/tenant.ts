import { headers } from "next/headers";

import { resolveTenantIdFromHost } from "@/lib/tenant-resolver";

/** Vercel vb.: x-forwarded-host virgülle birden fazla değer içerebilir. */
function primaryHostFromHeaders(h: Headers): string {
  const forwarded = h.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return h.get("host") ?? "";
}

/**
 * Önce middleware'in `x-tenant-id` değeri; yoksa `Host` / `x-forwarded-host` ile çözümleme.
 * (Production'da bazı isteklerde middleware header'ı Route Handler'a iletilmeyebilir — Vercel.)
 */
export function getTenantId(): string {
  const h = headers();
  const fromMiddleware = h.get("x-tenant-id");
  if (fromMiddleware) return fromMiddleware;

  const host = primaryHostFromHeaders(h);
  const resolved = resolveTenantIdFromHost(host);
  if (resolved) return resolved;

  throw new Error(
    "tenant_id bulunamadı. Hostname tenant ile eşleşmiyor olabilir."
  );
}

/**
 * Tenant ID'yi optional döndürür. Bazı route'larda (örn. health check) gerekmez.
 */
export function getTenantIdOptional(): string | null {
  const h = headers();
  const fromMiddleware = h.get("x-tenant-id");
  if (fromMiddleware) return fromMiddleware;
  const host = primaryHostFromHeaders(h);
  return resolveTenantIdFromHost(host);
}
