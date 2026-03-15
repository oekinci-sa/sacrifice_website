import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type HomepageMode = "anasayfa" | "thanks" | "takip";
export type HomepageLayout = "default" | "golbasi" | "kahramankazan";

export interface HomepageSettings {
  mode: HomepageMode;
  layout: HomepageLayout;
}

export async function getHomepageSettings(tenantId: string): Promise<HomepageSettings> {
  const { data } = await supabaseAdmin
    .from("tenant_settings")
    .select("homepage_mode, homepage_layout")
    .eq("tenant_id", tenantId)
    .single();

  return {
    mode: (data?.homepage_mode as HomepageMode) ?? "thanks",
    layout: (data?.homepage_layout as HomepageLayout) ?? "default",
  };
}
