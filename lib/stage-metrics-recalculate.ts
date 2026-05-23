import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** Arıza kaydı eklendikten/güncellendikten/silindikten sonra ortalama süreleri yeniden hesaplar. */
export async function recalculateStageMetricsAverages(
  tenantId: string,
  sacrificeYear: number
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("recalculate_stage_metrics_averages", {
    p_tenant_id: tenantId,
    p_sacrifice_year: sacrificeYear,
  });
  if (error) {
    console.error("recalculate_stage_metrics_averages", error);
    throw error;
  }
}
