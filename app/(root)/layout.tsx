import { getHomepageSettings } from "@/lib/homepage-settings";
import { getTenantId } from "@/lib/tenant";
import PublicLayout from "../(public)/layout";
import TakipLayout from "../(takip)/layout";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantId = getTenantId();
  const { mode } = await getHomepageSettings(tenantId);

  if (mode === "live" || mode === "anasayfa") {
    return <PublicLayout>{children}</PublicLayout>;
  }

  return <TakipLayout>{children}</TakipLayout>;
}
