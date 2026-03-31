import type { Session } from "next-auth";

/** Kurban admin düzenleme API’lerinde kabul edilen roller */
export function sessionHasAdminEditorOrSuperRole(session: Session | null): boolean {
  const r = session?.user?.role;
  return r === "admin" || r === "super_admin" || r === "editor";
}

/**
 * Audit / DB last_edited_by: yalnızca oturum e-postası (isim asla yazılmaz).
 */
export function getSessionActorEmail(session: Session | null): string | null {
  const email = session?.user?.email?.trim();
  return email || null;
}

/** Takip (kesimhane) ekranı — oturum yokken kullanılan sabit aktör etiketi */
export const TAKIP_EKRANI_ACTOR = "takip-ekranı";

/** Hisse al (müşteri) akışı — DB `update_empty_share` ile aynı metin (change_logs.change_owner) */
export const HISSE_AL_AKISI_ACTOR = "Hisse al akışı";
