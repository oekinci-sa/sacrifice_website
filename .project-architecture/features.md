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

### Elya Tenant – Hisse Fiyat Skalası
Elya (Gölbaşı, tenant_id: 00000000-0000-0000-0000-000000000003) için hisse fiyat skalası:

| share_weight (kg) | share_price (TL) |
|-------------------|------------------|
| 23 | 25.000 |
| 25 | 26.500 |
| 28 | 29.500 |
| 32 | 34.000 |
| 35 | 37.000 |
| 37 | 39.500 |
| 39 | 41.500 |
| 43 | 45.000 |
| 46 | 48.500 |
| 50 | 51.000 |

- 2026 production reseed: [db/operational_scripts/elya_2026_production_reseed.sql](db/operational_scripts/elya_2026_production_reseed.sql)

## Tema Davranışı
- 3001 (kahramankazan): yeşil tema.
- 3002 (golbasi): mavi tema.
- 3000 / Vercel test: özel tema yok (shadcn varsayılan).

## sacrifice_year
- shareholders, reservation_transactions, change_logs, reminder_requests tablolarında sacrifice_year alanı.
- Admin panelde yıl bazlı filtreleme.

## Admin Tema (Nötr + Tenant Accent)
- **Nötr tema** (`.admin-neutral-theme`): Admin panelinde sidebar, nav ve genel UI nötr gri tonlarda; tenant yeşil/mavi kullanılmaz.
- **Tenant accent** (`.admin-tenant-accent`): Badge'ler ve CTA butonları (Yeni Kurbanlık, Kaydet, filtre sayı badge'leri) tenant renginde kalır.
- Detay: [colors.md](colors.md)

## Sidebar
- Dar ve geniş görünüm.
- Dar modda ikonlar görünür.
- Badge'ler (Rezervasyonlar, Uyumsuzluklar vb.) tenant renginde; realtime güncelleme.

## Mail İşlemleri (Resend)
- Sayfa: `/kurban-admin/mail-islemleri` — konu + **TipTap** WYSIWYG mesaj (ham etiket görünmez); gövde HTML olarak `POST /api/admin/send-email` (`body`); sunucuda `isomorphic-dompurify` ile sanitize. Alıcılar: `GET /api/admin/email-recipients?year=`. Ortam: `RESEND_API_KEY_ANKARAKURBAN`, `RESEND_API_KEY_ELYAHAYVANCILIK`; yedek `RESEND_API_KEY`. Gönderen varsayılan: `iletisim@ankarakurban.com.tr` / `iletisim@elyahayvancilik.com.tr`.
- **Otomatik teşekkür e-postası:** Hisse alımı tamamlanıp teşekkür / PDF sayfasına düşünce `POST /api/purchase-confirmation-email` (e-posta adresi girilmiş hissedarlara; `reservation_transactions.purchase_confirmation_email_sent_at` ile idempotency).

## Türkçe UI
- Tüm kullanıcıya görünen metinler Türkçe (label, buton, placeholder, tooltip).
- Varsayılan İngilizce bırakma: Submit, Cancel, Search vb.
- Terminoloji tutarlı; Türkçe karakterler doğru (Ş, İ, Ğ, Ü, Ö, Ç).

## Bana Haber Ver (Takip sayfası)
- `reminder_requests` tablosu: tenant_id, name, phone (tenant+phone unique)
- POST /api/reminder-requests, GET /api/reminder-requests/check
- Daha önce kayıtlıysa uyarı toast, yoksa kayıt + başarı toast

## Admin Tablo Sayfaları
- **Sütun sırası:** Tüm admin `CustomDataTable` sayfalarında `storageKey` ile kullanıcı bazlı kalıcılık; başlık satırından sürükle-bırak (hedef hücrenin sol/sağ yarısı = önce/sonra; bırakma yeri dikey çizgi ile gösterilir). Toolbar’lı sayfalarda `ColumnSelectorPopover` içinde **varsayılan sütun düzenine dön** (`[]` sıra). Ayrıntı: [changelogs/changelog-2026-03-admin-column-reorder.md](changelogs/changelog-2026-03-admin-column-reorder.md).
- **Rezervasyonlar** (`/kurban-admin/rezervasyonlar`): reservation_transactions tablosu (tenant kapsamlı); tabloda **İşlem Bitişi** (`completed_at`) — aktif → tamamlandı / iptal / zaman aşımı / süre doldu geçişinde trigger ile set edilir. Tablo üstünde **Kurban No**, **Hisse Sayısı**, **Durum** çoklu seçim filtreleri + tümünü temizle. **Realtime**: Supabase `postgres_changes` ile badge ve tablo anında güncellenir; polling yok.
- **Aşama Metrikleri** (`/kurban-admin/asama-metrikleri`): stage_metrics tablosu (tenant kapsamlı)
- **Uyumsuz Hisseler** (`/kurban-admin/uyumsuz-hisseler`): mismatched_shares view + mismatched_share_acknowledgments; hisse sayısı ≠ 7 olan kurbanlıklar, "Tamam biliyorum" ile farkındalık kaydı; yeni hissedar eklenince trigger ile sıfırlanır. **Aktif rezervasyon**: `status=active` olan reservation_transactions'a sahip hayvanlar listeden çıkarılır (henüz hissedar eklenmemiş geçici uyumsuzluk önlenir).

## last_edited_by / change_owner (Admin)
- **Faz 1 (API):** `PUT /api/update-sacrifice`, `POST /api/update-sacrifice-share`, `POST /api/update-sacrifice-timing` için `last_edited_by` **sunucuda** oturumdan türetilir (yalnızca e-posta; isim asla yazılmaz). Public: `takip-ekranı` / `hisseal-akisi`. **Oluşturma:** `POST /api/create-sacrifice` editor+ ve oturum e-postası zorunlu; `last_edited_by` / zaman sunucuda. `POST /api/create-shareholders` — `last_edited_by` = oturum e-postası yoksa `hisseal-akisi` (istemci alanı yok sayılır; `purchased_by` müşteri bilgisi için kalır).
- **Faz 2 (shareholders):** `rpc_update_shareholder` / `rpc_delete_shareholder` — `set_config('app.actor', …)` + genişletilmiş `log_shareholder_changes` (DELETE’te silen = actor). `POST /api/update-shareholder` ve `POST /api/delete-shareholder` bu RPC’leri kullanır.
- **Faz 3 (sacrifice_animals):** `rpc_update_sacrifice_core` / `rpc_update_sacrifice_timing` / `rpc_update_sacrifice_share` — `app.actor` + `log_sacrifice_changes` genişletildi (`share_weight`, `empty_share`, `notes`, DELETE’te `app.actor`). `PUT /api/update-sacrifice`, `POST /api/update-sacrifice-timing`, `POST /api/update-sacrifice-share` bu RPC’leri kullanır; kurban güncellemede `last_edited_by_display` döner. **Silme:** `DELETE /api/sacrifices/[id]` → `rpc_delete_sacrifice` (aynı transaction’da hissedar + rezervasyon + kurban; `change_logs` silende `app.actor`).
- **Faz 4 (uyumsuzluk):** `rpc_acknowledge_mismatch` / `rpc_revoke_mismatch` — farkındalık kaydı + açık `change_logs` (`Hisse Uyumsuzluğu`). `POST /api/admin/mismatched-shares/acknowledge` ve `.../revoke`.
- **Faz 5 (kullanıcılar):** `rpc_create_user` / `rpc_update_user` / `rpc_delete_user` / `rpc_patch_user_tenant_status` — `users` + `user_tenants` + açık `change_logs` (`Kullanıcılar`). `POST/PUT/DELETE /api/users/*`, `PATCH /api/users/[id]/status`.
- **Faz 6 (aşama metrikleri):** `rpc_update_stage_metrics` — `app.actor` + `change_logs` (`Aşama Metrikleri`, anlık kurban numarası). `POST /api/update-stage-metrics` (editor+; oturum e-postası zorunlu).
- **Faz 7 (dokümantasyon):** `.project-architecture` altında migration + `db/tables/...` RPC/trigger SQL senkronu; [features.md](features.md), [role-permissions.md](role-permissions.md), [user-flows.md](user-flows.md), [pages/admin-pages.md](pages/admin-pages.md); audit changelog: [changelog-2026-03-admin-audit-rpc-faz6-7.md](changelogs/changelog-2026-03-admin-audit-rpc-faz6-7.md).
- **Gösterim:** DB’de `last_edited_by` ve `change_logs.change_owner` = **e-posta** (veya sistem etiketi). `GET /api/get-shareholders`, `GET /api/admin/shareholders/[id]`, `GET /api/get-change-logs` yanıtında kullanıcı adı `users.name` ile eşlenir; admin tabloda **isim** gösterilir (`last_edited_by_display` / `change_owner` çözümlü metin).
- **update-shareholder / delete-shareholder:** Oturum **e-postası** zorunlu; istemci `last_edited_by` gönderse bile sunucu yok sayar.
- `sacrifice_animals.last_edited_by`: admin için e-posta; Faz 3 RPC ile güncelleme ve tetikleyicide `app.actor` ile uyumlu.
- **Son Düzenleyen sütunu:** E-postası `users`’ta yoksa veya eşleşme yoksa tabloda ham değer (e-posta veya `takip-ekranı` vb.) gösterilir.

## Admin Sayfa Başlıkları ve Açıklamalar
- Menü adı = sayfa başlığı (örn. "Kurbanlıklar", "Hissedarlar" — "Tüm X" kaldırıldı).
- Açıklamalar sade, `max-w-[50%]` ile sayfa genişliğinin yarısını kaplar.
- Breadcrumb: tum-kurbanliklar→Kurbanlıklar, tum-hissedarlar→Hissedarlar, uyumsuz-hisseler→Uyumsuzluklar.

## Kurbanlıklar – Ödeme Durumu Popup
- Ödeme durumu çubuklarına hover: 2 sütunlu popup, her hissedar adı önünde sıra numarası (1. 2. 3. 4.).
- Hissedarı olmayan hayvanda popup açılmaz.

## Changelog
- **2026-03 Admin audit RPC (Faz 6–7)**: [changelogs/changelog-2026-03-admin-audit-rpc-faz6-7.md](changelogs/changelog-2026-03-admin-audit-rpc-faz6-7.md)
- **2025-03 UI iyileştirmeleri**: [changelogs/changelog-2025-03-ui-improvements.md](changelogs/changelog-2025-03-ui-improvements.md)
- **2025-03 Admin realtime, tema, UI**: [changelogs/changelog-2025-03-admin-realtime-theme.md](changelogs/changelog-2025-03-admin-realtime-theme.md)
