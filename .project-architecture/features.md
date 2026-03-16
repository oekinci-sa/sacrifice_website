# Component Features


---

## Responsive Tasarım
- Tüm bileşenler mobil, tablet ve desktop uyumlu olmalıdır.
- Detay: `.cursor/rules/responsive-design.mdc`

## Yıl Bazlı Veri (Public vs Admin)
- **Public sayfalar:** Tenant'a özgü yıl (`tenant_settings.active_sacrifice_year` veya `sacrifice_animals` MAX). URL `?year=` ile override. Fallback yok.
- **Admin sayfalar:** DB'de tenant için en son `sacrifice_year`. Avatar solunda yıl dropdown. Veri yoksa `tenant_settings.active_sacrifice_year`; ikisi de yoksa 500.
- **Resolver:** [lib/sacrifice-year-resolver.ts](lib/sacrifice-year-resolver.ts) — `resolveSacrificeYearForTenant()`

## Tenant Branding (Elya / Ankara Kurban)
- `tenant_settings`: logo_slug, iban, website_url, contact_phone, contact_email, contact_address.
- Header/footer logo: `public/logos/{logo_slug}/`.
- **Logo boyutları (header = footer):** Ankara `w-[225px] md:w-[250px]`, Elya `w-[112px] md:w-[125px]`.
- **Test tenant:** Logo yerine "KURBAN SİTESİ" metni (Instrument Sans bold).
- PDF makbuz: tenant'a göre logo, IBAN, iletişim bilgileri.

## Tema Davranışı
- 3001 (kahramankazan): yeşil tema.
- 3002 (golbasi): mavi tema.
- 3000 / Vercel test: özel tema yok (shadcn varsayılan).

## sacrifice_year
- shareholders, reservation_transactions, change_logs, reminder_requests tablolarında sacrifice_year alanı.
- Admin panelde yıl bazlı filtreleme.

## Sidebar
- Dar ve geniş görünüm.
- Dar modda ikonlar görünür.
- Giriş yapan kullanıcı bilgisi sol alt; dark/light mode seçimi.

## Türkçe UI
- Tüm kullanıcıya görünen metinler Türkçe (label, buton, placeholder, tooltip).
- Varsayılan İngilizce bırakma: Submit, Cancel, Search vb.
- Terminoloji tutarlı; Türkçe karakterler doğru (Ş, İ, Ğ, Ü, Ö, Ç).

## Bana Haber Ver (Takip sayfası)
- `reminder_requests` tablosu: tenant_id, name, phone (tenant+phone unique)
- POST /api/reminder-requests, GET /api/reminder-requests/check
- Daha önce kayıtlıysa uyarı toast, yoksa kayıt + başarı toast

## Admin Tablo Sayfaları
- **Rezervasyonlar** (`/kurban-admin/rezervasyonlar`): reservation_transactions tablosu (tenant kapsamlı)
- **Aşama Metrikleri** (`/kurban-admin/asama-metrikleri`): stage_metrics tablosu (tenant kapsamlı)
- **Uyumsuz Hisseler** (`/kurban-admin/uyumsuz-hisseler`): mismatched_shares view + mismatched_share_acknowledgments; hisse sayısı ≠ 7 olan kurbanlıklar, "Tamam biliyorum" ile farkındalık kaydı; yeni hissedar eklenince trigger ile sıfırlanır

## last_edited_by / change_owner (Admin)
- Admin bölümünden yapılan düzenlemelerde `last_edited_by` **email** olarak saklanır (sacrifice_animals, shareholders).
- Değişiklik Kayıtları: `change_owner` DB'de email; API `users` tablosu ile eşleştirip **name** döndürür.
- Sadece users tablosunda kayıtlı kullanıcılar "Son Düzenleyen" sütununda görünür.

## Changelog
- **2025-03 UI iyileştirmeleri**: [changelog-2025-03-ui-improvements.md](changelog-2025-03-ui-improvements.md)
