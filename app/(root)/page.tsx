import { getHomepageSettings } from "@/lib/homepage-settings";
import { getTenantId } from "@/lib/tenant";
import AnasayfaContent from "../(public)/onizleme/anasayfa/page";
import TakipContent from "../(takip)/(takip)/page-takip";
import TakipHomeLaunchCountdown from "../(takip)/components/takip-home-launch-countdown";
import TakipHomeContent from "../(takip)/components/takip-home-content";
import ThanksContent from "../(takip)/onizleme/tesekkur/page";

export default async function RootPage() {
  const tenantId = getTenantId();
  const { mode } = await getHomepageSettings(tenantId);

  switch (mode) {
    case "live":
    case "anasayfa":
      return <AnasayfaContent />;
    case "geri_sayim":
      return <TakipHomeLaunchCountdown />;
    case "tesekkur":
      return <ThanksContent />;
    case "follow_up":
    case "takip":
      return <TakipContent />;
    default:
      // bana_haber_ver ve bilinmeyen değerler
      return <TakipHomeContent />;
  }
}
