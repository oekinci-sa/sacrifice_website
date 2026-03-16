import { TenantBrandingProvider } from "@/app/providers/TenantBrandingProvider";
import { getTenantBranding } from "@/lib/tenant-branding";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getTenantBranding();

  return (
    <TenantBrandingProvider initialBranding={branding}>
      {children}
    </TenantBrandingProvider>
  );
}
