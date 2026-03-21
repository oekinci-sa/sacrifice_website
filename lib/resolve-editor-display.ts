import type { SupabaseClient } from "@supabase/supabase-js";

/** users tablosuna göre e-posta → gösterim adı (yoksa e-posta) */
export async function buildEmailToEditorDisplayMap(
  supabase: SupabaseClient,
  rawValues: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const emails = Array.from(
    new Set(
      rawValues.filter(
        (v): v is string => typeof v === "string" && v.includes("@")
      )
    )
  );
  if (emails.length === 0) return new Map();

  const { data } = await supabase
    .from("users")
    .select("email, name")
    .in("email", emails);

  const map = new Map<string, string>();
  for (const u of data || []) {
    if (u.email) {
      const label = (u.name && u.name.trim()) ? u.name.trim() : u.email;
      map.set(u.email, label);
    }
  }
  return map;
}

/**
 * DB'de saklanan editör kimliği (e-posta veya sistem etiketi) → admin UI metni
 */
export function editorDisplayFromRaw(
  raw: string | null | undefined,
  emailToDisplay: Map<string, string>
): string {
  if (!raw || !String(raw).trim()) return "";
  const t = String(raw).trim();
  if (t.includes("@")) {
    return emailToDisplay.get(t) ?? t;
  }
  return t;
}
