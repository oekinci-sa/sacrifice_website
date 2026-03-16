"use client";

import { useTenantBrandingContext } from "@/app/providers/TenantBrandingProvider";

/**
 * Tenant branding bilgisi. TenantBrandingProvider ile sarılı sayfalarda
 * sunucudan gelen initial branding ile ilk paint'te doğru logo gösterilir (flash önlenir).
 */
export function useTenantBranding() {
  return useTenantBrandingContext();
}
