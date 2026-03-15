import { getTenantId } from "@/lib/tenant";
import PublicLayout from "../(public)/layout";
import TakipLayout from "../(takip)/layout";

const GOLBASI_TENANT_ID = "00000000-0000-0000-0000-000000000003";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantId = getTenantId();

  if (tenantId === GOLBASI_TENANT_ID) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  return <TakipLayout>{children}</TakipLayout>;
}
