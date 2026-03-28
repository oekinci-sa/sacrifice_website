# Tech Stack

## Frontend
React 18, Next.js 14, TypeScript, Shadcn, Shadcn Charts, TailwindCSS

- TypeScript tanımları `types/` altında.
- Formlar: react-hook-form + Zod validasyonu.
- Client state: Zustand veya useState.
- Custom hooks: `hooks/` klasörü.
- DB işlemleri sonrası sonucu shadcn toast ile bildir.
- Tüm sayfalar desktop ve mobile uyumlu (müşteri %99 mobil).
- Shadcn design system; gerekirse Tailwind ile component.

### Özelleştirme sırası (en az kırılgan olandan)
1. CSS tokens/variables (tailwind.config.ts, globals.css)
2. Shared config (layout, theme)
3. Mevcut component'lerin props/slots ile extend edilmesi
4. Wrapper component'ler (components/custom-components)
5. Son çare: shadcn'den kopyalayıp sahiplen (vendor-copy)

### Server/Client sınırı (Next.js)
- layout.tsx ve route'lar Server Component (interaktivite gerekmedikçe).
- İnteraktif widget'lar (toast, modal, form) için "use client" – küçük ve izole.
- Hydration mismatch'lerden kaçın.

## Backend
Supabase

- E-posta (Resend, HTML sanitize, transactional logo kuralları): `email-and-resend.md`.
- `utils/supabaseClient.ts` veya `lib/supabaseAdmin` kullan.
- Realtime database özelliğini kullan; subscription oluştur.
- DB işlemleri sonrası shadcn toast ile sonucu bildir.

## Veritabanı
Şema ve tablo detayları için `db/` klasörüne bakın. Tablo listesi: sacrifice_animals, shareholders, change_logs, users, reservation_transactions, stage_metrics, tenants, tenant_settings, tenant_domains, failed_reservation_transactions_logs.
