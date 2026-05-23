# SMS — Tenant bayrağı, admin görünümü ve hissedar zaman çizelgesi

Bu belge, `tenant_settings.sms_enabled` ile yönetilen SMS modülü görünürlüğü, Tüm Hissedarlar tablosu, Organizasyon Ayarları süper admin düzenlemesi ve hissedar SMS geçmişi panelinin davranışını özetler. Teknik API ve iş akışı için bkz. [sms-operations.md](./sms-operations.md).

---

## Veritabanı: `sms_enabled`

- **Konum:** `public.tenant_settings.sms_enabled` — `BOOLEAN NOT NULL DEFAULT FALSE`
- **Anlam:** Bu tenant için admin arayüzünde SMS menüsünün ve (Tüm Hissedarlar’da) SMS sütununun gösterilip gösterilmeyeceği. Gönderimin gerçekten çalışması ayrıca **Bizim SMS ortam değişkenleri** ve `lib/sms-config.ts` içindeki tenant kimlik eşlemesine bağlıdır (`getSmsCredentials` null ise gönderim 503).
- **Varsayılan:** Yeni kurulumlarda tenant’lar `FALSE`. Production migration’ında Ankara Kurban tenant UUID’si `TRUE` olabilir.
- DDL kaynağı: [db/tables/tenant_settings/table.sql](./db/tables/tenant_settings/table.sql)

---

## Veri yüzeyi (`TenantBranding`)

| Kaynak | Açıklama |
|--------|-----------|
| Tip / varsayılan | [lib/tenant-branding-defaults.ts](../lib/tenant-branding-defaults.ts) — `sms_enabled: boolean` (varsayılan `false`) |
| Sunucu SSR | [lib/tenant-branding.ts](../lib/tenant-branding.ts) `getTenantBranding()` → select içinde `sms_enabled` |
| Genel API | [app/api/tenant-settings/route.ts](../app/api/tenant-settings/route.ts) → `branding.sms_enabled` |
| Provider | [app/providers/TenantBrandingProvider.tsx](../app/providers/TenantBrandingProvider.tsx) → fetch sonrası `sms_enabled` set |

Sidebar ve Tüm Hissedarlar `useTenantBranding()` → `branding.sms_enabled` okur.

---

## Sidebar: SMS İşlemleri menüsü

- Dosya: [app/(admin)/kurban-admin/components/layout/app-sidebar.tsx](../app/(admin)/kurban-admin/components/layout/app-sidebar.tsx)
- **Güncel:** `sms-operations` görünür yalnızca `branding.sms_enabled === true` ve rol uygun ise. Eski **`allowedTenantIds: [KAHRAMANKAZAN_TENANT_ID]`** kullanılmaz.

---

## Tüm Hissedarlar — SMS vs PDF sırası

- Dosya: [app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/columns.tsx](../app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/columns.tsx)
- `getColumns(smsEnabled)` → `smsEnabled === false` iken **`sms_history` kolon tanımı hiç eklenmez**.
- **`smsEnabled === true` iken varsayılan kolon sırası:** SMS sütunu, **PDF sütununun hemen soluna** eklenir (`pdf` kolonunun indeksinde `splice` ile). Özet sıra: `… SMS · PDF · actions`.
- Sayfa: [tum-hissedarlar/page.tsx](../app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/page.tsx) → `useMemo(() => getColumns(branding.sms_enabled), ...)`
- Başlıklar: [lib/admin-table-column-labels/hissedarlar.ts](../lib/admin-table-column-labels/hissedarlar.ts) — `sms_history: "SMS"`, `pdf: "PDF"`

Kullanıcı sütun sırasını `localStorage` (`storageKey="hissedarlar"`) ile değiştirebilir; `CustomDataTable` içinde daha sonra eklenen kolon kimlikleri (ör. `sms_history`), kayıtlı sırada yoksa **kolon tanımındaki** sıraya göre araya yerleştirilir (yüklenmezse `sms_history` tekrar PDF’in solunda kalır).

---

## Organizasyon Ayarları — SMS sütunları

Sayfa: `/kurban-admin/tenant-ayarlari`  
API: **`PATCH /api/admin/tenant-settings/[tenantId]`** — [route.ts](../app/api/admin/tenant-settings/[tenantId]/route.ts)

| Sütun | DB alanı | Bileşen | Anlam |
|-------|----------|---------|--------|
| **SMS** | `sms_enabled` | `SmsEnabledToggleCell` | SMS modülü: sidebar **SMS İşlemleri**, Tüm Hissedarlar `sms_history` sütunu, manuel gönderim yüzeyi |
| **Oto. SMS** | `sms_auto_enabled` | `SmsAutoEnabledToggleCell` | Kurban günü otomatik SMS: kesim/parçalama/teslimat aşaması tamamlanınca `event_key` eşleşen şablonlar (`lib/sms-auto-sender.ts`) |

**İkisi birlikte:** Kurban günü otomatik gönderim için `sms_enabled` **ve** `sms_auto_enabled` açık olmalı; ayrıca aktif şablon (`sms_templates.event_key`) ve Bizim SMS kimliği (`lib/sms-config.ts`) gerekir.

**Ödeme otomatik SMS** (`payment_amount_updated`, ödenen tutar güncellenince): yalnızca **`sms_enabled`** yeterli; `sms_auto_enabled` gerekmez. Şablon: `/kurban-admin/sms-islemleri/sablonlari`.

Tam form (offset’ler dahil): [tenant-settings-edit-dialog.tsx](../app/(admin)/kurban-admin/tenant-ayarlari/components/tenant-settings-edit-dialog.tsx) — «Otomatik SMS Gönderimi» bölümü (`sms_auto_enabled`, `sms_slaughter_approach_offset`, `sms_delivery_pickup_offset`).

Ortak toggle mantığı: [editable-tenant-cells.tsx](../app/(admin)/kurban-admin/tenant-ayarlari/components/editable-tenant-cells.tsx) — `SmsToggleCell` + `SmsEnabledToggleCell` / `SmsAutoEnabledToggleCell`.

---

## Hissedar SMS geçmişi (sheet)

Dosya: [shareholder-sms-timeline-sheet.tsx](../app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/shareholder-sms-timeline-sheet.tsx)

| Özellik | Davranış |
|---------|-----------|
| API | `GET /api/admin/sms/shareholder-history?shareholderId=` |
| `skipped` | İstemci listesinden **filtrelenir**; atlandı/geçtiğini görmek için Gönderim Geçmişi detayı kullanılır |
| Başlık temizliği | [lib/sms-send-title-display.ts](../lib/sms-send-title-display.ts) |
| Gösterilen bloklar | Zaman satırı, kısaltılmış başlık, tam `personalized_message` |
| Gizlenen | Durum rozeti ve «Gönderilen metin boyu» satırı |
| Yeni SMS | Şablon + `SmsEditor` → `POST /api/admin/sms/send` tekil hissedar |

---

## SMS Gönder — toast ve önizleme notları

- Başarı yanıtı: `excluded`, `excluded_invalid_phone`, `excluded_duplicate_phone` ([send/route.ts](../app/api/admin/sms/send/route.ts))
- Dedup anahtarı: [lib/sms-dedup.ts](../lib/sms-dedup.ts) — **isim kullanılmaz**, normalize cep + kurban bağlamı
- Şablon `DELETE`: soft delete (`is_active = false`); FK ve geçmiş korunur
- Şablon listesi pasifleri: `GET …/templates?inactive=true`
- **Kayıtlı Toplu Gönderimler** sidebar menü kalemi kaldırıldı (URL doğrudan açılabilir)

---

## İlgili kod dosya listesi

| Konu | Dosya |
|------|-------|
| Sidebar | `components/layout/app-sidebar.tsx` |
| Hissedar kolon sırası | `hissedarlar/tum-hissedarlar/components/columns.tsx` |
| Organizasyon SMS / Oto. SMS | `tenant-ayarlari/components/editable-tenant-cells.tsx`, `columns.tsx`, `tenant-settings/[tenantId]/route.ts` |
| Otomatik SMS motoru | `lib/sms-auto-sender.ts`, `api/update-sacrifice-timing/route.ts` |
| Kimlik (Bizim SMS) | `lib/sms-config.ts` |
