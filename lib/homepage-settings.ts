import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type HomepageMode =
  | "bana_haber_ver"
  | "geri_sayim"
  | "live"
  | "tesekkur"
  | "follow_up"
  | "anasayfa"
  | "takip";

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
    mode: (data?.homepage_mode as HomepageMode) ?? "bana_haber_ver",
  };
}
