import { headers } from "next/headers";

/**
 * Request header'ından tenant_id okur. Middleware tarafından x-tenant-id olarak set edilir.
 * Tenant yoksa hata fırlatır.
 */
export function getTenantId(): string {
  const tenantId = headers().get("x-tenant-id");
  if (!tenantId) {
    throw new Error("tenant_id bulunamadı. Hostname tenant ile eşleşmiyor olabilir.");
  }
  return tenantId;
}

/**
 * Tenant ID'yi optional döndürür. Bazı route'larda (örn. health check) gerekmez.
 */
export function getTenantIdOptional(): string | null {
  return headers().get("x-tenant-id");
}
