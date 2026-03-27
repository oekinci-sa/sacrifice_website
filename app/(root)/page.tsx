import { getHomepageSettings } from "@/lib/homepage-settings";
import { getTenantId } from "@/lib/tenant";
import AnasayfaContent from "../(public)/onizleme/anasayfa/page";
import TakipContent from "../(takip)/(takip)/page-takip";
import TakipHomeLaunchCountdown from "../(takip)/components/takip-home-launch-countdown";
import TakipHomeContent from "../(takip)/components/takip-home-content";
import ThanksContent from "../(public)/onizleme/thanks/page";

export default async function RootPage() {
  const tenantId = getTenantId();
  const { mode } = await getHomepageSettings(tenantId);

  switch (mode) {
    case "live":
    case "anasayfa":
      return <AnasayfaContent />;
    case "launch_countdown":
      return <TakipHomeLaunchCountdown />;
    case "thanks":
      return <ThanksContent />;
    case "follow_up":
    case "takip":
      return <TakipContent />;
    default:
      // pre_campaign
      return <TakipHomeContent />;
  }
}
