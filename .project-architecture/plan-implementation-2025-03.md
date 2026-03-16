# Plan Uygulaması – sacrifice_year, Admin Yıl Seçici, Tenant Branding, Tema, Responsive

Bu doküman 2025-03 planının uygulanan adımlarını özetler.

---

## 1. sacrifice_year (Veritabanı)

- **Tablolar**: `shareholders`, `reservation_transactions`, `change_logs`, `reminder_requests` tablolarına `sacrifice_year` kolonu eklendi.
- **Trigger'lar**: `log_shareholder_changes`, `log_sacrifice_changes` trigger'ları `sacrifice_year` yazacak şekilde güncellendi.
- **API'ler**: `create-shareholders`, `create-reservation`, `reminder-requests` API'leri `sacrifice_year` ekliyor.
- **Filtreleme**: `get-shareholders`, `get-reservation-transactions`, `get-change-logs`, `get-sacrifice-animals` API'leri `?year=` parametresi ile filtreliyor.

---

## 2. Admin Yıl Seçici

- **Endpoint**: `GET /api/admin/active-year` → `activeYear`, `availableYears` döner.
- **Store**: `useAdminYearStore` – `selectedYear`, `availableYears`, `fetchActiveYear`, `setSelectedYear`.
- **UI**: Header'da avatar solunda shadcn dropdown (`YearDropdown`).
- **DataProvider**: `AdminDataProvider` seçilen yıla göre hissedarlar, rezervasyonlar, kurbanlıklar ve değişiklik kayıtlarını çeker.

---

## 3. Tenant Branding (Elya / Ankara Kurban)

- **tenant_settings**: `logo_slug`, `iban`, `website_url`, `contact_phone`, `contact_email`, `contact_address` kolonları.
- **lib/tenant-branding.ts**: `getTenantBranding()` (server).
- **hooks/useTenantBranding.ts**: Client hook – `/api/tenant-settings` üzerinden branding alır.
- **Logo**: `components/layout/header/logo.tsx` – `public/logos/{logo_slug}/` kullanır.
- **Footer**: `components/layout/footer/footer.tsx` – tenant'a göre logo, IBAN, iletişim.
- **PDF**: `ReceiptPDF.tsx` – tenant'a göre logo, IBAN, website, contact; `lib/logoBase64.ts` – `logoBase64BySlug`, `getLogoBase64ForSlug()`.

---

## 4. Tema Davranışı

- **ThemeStyles.tsx**: `tenantId === TEST_TENANT_ID` ise `null` döner (shadcn varsayılan tema).
- **3001 (kahramankazan)**: Yeşil tema.
- **3002 (golbasi)**: Mavi tema (DB'de theme_json).
- **3000 / Vercel test**: Özel tema yok.

---

## 5. Types

- `shareholderSchema`: `sacrifice_year` eklendi.
- `changeLogSchema`: `sacrifice_year` eklendi.
- `ReservationTransaction`: `sacrifice_year` eklendi.

---

## 6. Responsive Tasarım Kuralı

- **Rule**: `.cursor/rules/responsive-design.mdc`
- Tüm bileşenler mobil, tablet ve desktop uyumlu olmalıdır.
- Breakpoint'ler: sm (640px), md (768px), lg (1024px).

---

## 7. Dokümantasyon

- **features.md**: Admin yıl seçici, tenant branding, tema, sacrifice_year, responsive bölümleri eklendi.
- **responsive-design.mdc**: Yeni rule dosyası.

---

## 8. Admin Tabloları (2025-03-16)

- **Sütun tutarlılığı:** Kur. Sır., İsim Soyisim, Telefon, Teslimat Tercihi, Teslimat Yeri, Görüşüldü, Ödeme Durumu, Kayıt Tarihi – tüm hissedar tablolarında aynı adlar.
- **Tüm Hissedarlar:** Teslimat Yeri sütunu eklendi; sütun sırası Görüşüldü → Ödeme → Kayıt Tarihi; Vekalet varsayılan gizli.
- **Ödemeler:** Sütunlar popover, Excel'e Aktar, Teslimat Tercihi/Yeri, Kayıt Tarihi sütunları.
- **Animasyon:** CustomTableBody satırları motion.tr ile fade-in + stagger.
- **Rule:** `.cursor/rules/admin-tables.mdc`
