import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeEmail } from "@/lib/email-utils";

/** Panel kullanıcıları + seçilen yıldaki hissedar e-postaları (allowlist). */
export async function loadAllowedRecipientEmails(
  tenantId: string,
  sacrificeYear: number
): Promise<Set<string>> {
  const allowed = new Set<string>();

  const { data: userTenants, error: utError } = await supabaseAdmin
    .from("user_tenants")
    .select("user_id")
    .eq("tenant_id", tenantId);

  if (utError) {
    throw new Error(utError.message);
  }

  const userIds = (userTenants ?? []).map((r) => r.user_id as string);
  if (userIds.length > 0) {
    const { data: usersData, error: uError } = await supabaseAdmin
      .from("users")
      .select("email")
      .in("id", userIds);

    if (uError) {
      throw new Error(uError.message);
    }
    for (const u of usersData ?? []) {
      const e = u.email as string | null | undefined;
      if (e?.trim()) {
        allowed.add(normalizeEmail(e));
      }
    }
  }

  const { data: shRows, error: shError } = await supabaseAdmin
    .from("shareholders")
    .select("email")
    .eq("tenant_id", tenantId)
    .eq("sacrifice_year", sacrificeYear)
    .not("email", "is", null);

  if (shError) {
    throw new Error(shError.message);
  }

  for (const row of shRows ?? []) {
    const e = row.email as string | null | undefined;
    if (e?.trim()) {
      allowed.add(normalizeEmail(e));
    }
  }

  const { data: rrRows, error: rrError } = await supabaseAdmin
    .from("reminder_requests")
    .select("email")
    .eq("tenant_id", tenantId)
    .eq("sacrifice_year", sacrificeYear)
    .not("email", "is", null);

  if (rrError) {
    throw new Error(rrError.message);
  }

  for (const row of rrRows ?? []) {
    const e = row.email as string | null | undefined;
    if (e?.trim()) {
      allowed.add(normalizeEmail(e));
    }
  }

  return allowed;
}
