import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type HomepageMode =
  | "pre_campaign"
  | "launch_countdown"
  | "live"
  | "thanks"
  | "follow_up"
  | "anasayfa"  // geriye dönük uyumluluk
  | "takip";   // geriye dönük uyumluluk

export interface HomepageSettings {
  mode: HomepageMode;
}

export async function getHomepageSettings(tenantId: string): Promise<HomepageSettings> {
  const { data } = await supabaseAdmin
    .from("tenant_settings")
    .select("homepage_mode")
    .eq("tenant_id", tenantId)
    .single();

  return {
    mode: (data?.homepage_mode as HomepageMode) ?? "pre_campaign",
  };
}
