import { getTenantId } from "@/lib/tenant";
import AnasayfaContent from "../(public)/onizleme/anasayfa/page";
import TakipHomeContent from "../(takip)/components/takip-home-content";

const GOLBASI_TENANT_ID = "00000000-0000-0000-0000-000000000003";

export default async function RootPage() {
  const tenantId = getTenantId();

  if (tenantId === GOLBASI_TENANT_ID) {
    return <AnasayfaContent />;
  }

  return <TakipHomeContent />;
}
