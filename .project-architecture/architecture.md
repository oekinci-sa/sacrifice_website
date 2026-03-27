# Mimari Özet

## Çoklu Tenant

- **Çözümleme:** `lib/tenant-resolver.ts` → `resolveTenantIdFromHost(host)`
- **Middleware:** host → `x-tenant-id` header
- **API:** Her route `getTenantId()` ile tenant filtresi

### Port Bazlı Geliştirme (Local)

| Port | URL | Tenant |
|------|-----|--------|
| 3000 | `http://localhost:3000` | Gölbaşı |
| 3001 | `http://localhost:3001` | Kahramankazan |
| 3002 | `http://localhost:3002` | Test (Gölbaşı) |

**Komutlar:** `npm run dev:golbasi`, `dev:kahramankazan`, `dev:test`, `dev:all`

### Google OAuth Redirect URI
- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3001/api/auth/callback/google`
- `http://localhost:3002/api/auth/callback/google`

## Anasayfa Modu (homepage_mode)

- **Kaynak:** `tenant_settings.homepage_mode` (Supabase)
- **Değerler (örnek):** `bana_haber_ver`, `geri_sayim`, `live`, `tesekkur`, `follow_up`, `anasayfa`, `takip` — ayrıntı [.project-architecture/homepage-and-sacrifice-year.md](homepage-and-sacrifice-year.md)
- Root `/` sayfası DB'den bu değere göre ilgili bileşeni render eder (`app/(root)/page.tsx`)

## Yıl Bazlı Veri (sacrifice_year)

- **Kaynak:** `sacrifice_animals.sacrifice_year` (SMALLINT)
- Bayramın ilk gününün düştüğü miladi yıl (örn. 2025, 2026)
- Tüm sacrifice_animals sorguları `sacrifice_year` ile filtrelenir

### Public sayfalar (tenant'a özgü)

- **Kaynak:** `tenant_settings.active_sacrifice_year` veya `sacrifice_animals` MAX
- **Resolver:** `resolveSacrificeYearForTenant()` ([lib/sacrifice-year-resolver.ts](lib/sacrifice-year-resolver.ts))
- **Fallback yok:** Yıl bulunamazsa 500 hata

### Admin / diğer API'lar

- Varsayılan: `getDefaultSacrificeYear()` (env SACRIFICE_YEAR veya mevcut yıl)

## Tema (Tenant Renkleri)

- **Kaynak:** `tenant_settings.theme_json` (Supabase)
- **Enjeksiyon:** `ThemeStyles` Server Component → layout `<head>` içinde inline `:root` CSS
- **Neden sunucu:** Client-side fetch ilk paint'te varsayılan tema gösteriyordu (FOUC). Sunucuda enjekte edince ilk yüklemede doğru tenant renkleri görünür.
- **Detay:** `.project-architecture/colors.md`

## Auth

- NextAuth v4, JWT, Credentials + Google OAuth
- Redirect callback: request host kullanır
- Session: `tenant_id` header'dan eklenir

## Uygulama Yapısı

```
app/
├── (auth)/giris/
├── (admin)/kurban-admin/
├── (public)/          # ana sayfa, hisseal, hissesorgula, yazilar, iletisim
└── (takip)/           # kesimsirasi, parcalamasirasi, teslimatsirasi
```
