# Sacrifice Website – Proje Detayları

Proje hakkında bilgi almak için bu klasörün ilgili dosyalarına bakın. Tüm projeyi gezmeye gerek yoktur.

## İçindekiler

| Konu | Dosya |
|------|-------|
| **Klasör yapısı** | [README.md](./README.md) |
| **Mimari (tenant, auth, app)** | [architecture.md](./architecture.md) |
| **Tech stack** | [tech-stack.md](./tech-stack.md) |
| **Component/UI kuralları** | [features.md](./features.md) |
| **Public sayfalar** | [pages/public-pages.md](./pages/public-pages.md) |
| **Admin sayfaları** | [pages/admin-pages.md](./pages/admin-pages.md) |
| **Veritabanı** | [db/](./db/) |
| **RLS ve Realtime** | [db/rls-and-realtime.md](./db/rls-and-realtime.md) |
| **Homepage mode ve sacrifice year** | [homepage-and-sacrifice-year.md](./homepage-and-sacrifice-year.md) |
| **Araçlar ve versiyonlar** | [tools-versions.md](./tools-versions.md) |

## Kısa Özet

**Proje:** Türkiye’deki müslüman kurban organizasyonları için hisse alma, rezervasyon ve yönetim platformu.

**Özellikler:**
- Çoklu tenant (Gölbaşı, Kahramankazan vb.)
- Hisse seçimi, rezervasyon, SMS doğrulama
- Admin paneli (kurbanlıklar, hissedarlar, kullanıcı yönetimi)
- PDF çıktı, hisse sorgulama

**Teknoloji:** Next.js 14, React 18, TypeScript, Supabase, NextAuth, Shadcn, TailwindCSS

**Logo boyutları (header = footer):**
- Ankara Kurban: `w-[225px] md:w-[250px]`
- Elya Hayvancılık: `w-[112px] md:w-[125px]`
- Test tenant: Logo yerine "KURBAN SİTESİ" (Instrument Sans bold)

**Admin yıl varsayılanı:** Veri yoksa 2025 (geçen sezon)
