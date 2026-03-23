/** E-posta karşılaştırması ve allowlist için tek biçim. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
