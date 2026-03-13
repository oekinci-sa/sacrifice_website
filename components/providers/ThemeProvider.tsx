"use client";

/**
 * ThemeProvider - Tema sağlayıcı (passthrough)
 *
 * Tema artık sunucu tarafında ThemeStyles ile enjekte ediliyor (app/layout.tsx).
 * Bu component geçmişte client-side fetch yapıyordu; bu FOUC (flash) yaratıyordu.
 * Şimdi sadece children'ı render eder; Providers zincirinde yer tutucu olarak kalır.
 * İleride client-side tema değiştirme (örn. admin panelinden canlı önizleme) gerekirse
 * buraya tekrar fetch/apply logic eklenebilir.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
