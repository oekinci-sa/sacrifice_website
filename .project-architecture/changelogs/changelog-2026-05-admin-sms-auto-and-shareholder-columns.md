# Admin — otomatik SMS, hissedar saat sütunları, şablon filtresi (2026-05)

## Özet

Kurban günü otomatik SMS’in tenant bayrağı **Organizasyon Ayarları** tablosuna taşındı; Tüm Hissedarlar’da kurban saatleri gizli sütun olarak eklendi; SMS Şablonları sayfasında otomatik şablonlar için çoklu seçim filtresi ve düzenleme diyalogunda `event_key` Select düzeltmesi yapıldı.

## 1. Organizasyon Ayarları — `sms_auto_enabled`

| Öğe | Açıklama |
|-----|----------|
| DB | `tenant_settings.sms_auto_enabled` (BOOLEAN, default FALSE) — `sms_enabled`’dan **bağımsız** |
| Anlam | Kesim / parçalama / teslimat takip ekranlarında aşama tamamlanınca otomatik SMS motorunun çalışması |
| Tablo sütunu | **Oto. SMS** — `SmsAutoEnabledToggleCell` |
| API | `PATCH /api/admin/tenant-settings/[tenantId]` — `{ "sms_auto_enabled": true\|false }` |

**Not:** `sms_enabled` = SMS modülü (sidebar, manuel gönderim, hissedar SMS sütunu). İkisi birlikte açık olmalı ki otomatik gönderim gerçekleşsin (`lib/sms-auto-sender.ts` her ikisini de kontrol eder).

Dosyalar: `tenant-ayarlari/components/columns.tsx`, `editable-tenant-cells.tsx`, `tenant-settings-edit-dialog.tsx` (tam form düzenleme).

## 2. Otomatik SMS motoru

| Öğe | Konum |
|-----|--------|
| Motor | `lib/sms-auto-sender.ts` — `handleAutoSms()` |
| Tetikleyici | `POST /api/update-sacrifice-timing` — `is_completed === true` sonrası `.catch` ile non-blocking |
| Takip sayfaları | `/kesimsirasi`, `/parcalamasirasi`, `/teslimatsirasi` → `QueueCardWithButtons` |
| Idempotency | `sms_notification_events` (tenant + yıl + hissedar + `event_key` UNIQUE) |
| Şablon eşleme | `sms_templates.event_key` + `is_active = true` |

**Event anahtarları:** `slaughter_approaching`, `slaughter_completed`, `butcher_started`, `delivery_pickup_approaching`, `external_delivery_notice`.

**Tenant offset’leri:** `sms_slaughter_approach_offset`, `sms_delivery_pickup_offset` (Organizasyon Ayarları diyalogu).

Detay: [sms-operations.md](../sms-operations.md) — «Kurban günü otomatik SMS» bölümü.

## 3. Tüm Hissedarlar — Kesim / Teslim saati sütunları

| Sütun id | Başlık | Kaynak veri | Varsayılan |
|----------|--------|-------------|------------|
| `sacrifice_time` | Kesim Saati | `sacrifice.sacrifice_time` (join) | Gizli |
| `planned_delivery_time` | Teslim Saati | `sacrifice.planned_delivery_time` (join) | Gizli |

- API: `GET /api/get-shareholders` — nested `sacrifice_animals` select’te alanlar zaten vardı.
- Etiketler: `lib/admin-table-column-labels/hissedarlar.ts`
- Görünürlük: `tum-hissedarlar/page.tsx` → `columnVisibility` içinde `false`

## 4. SMS Şablonları sayfası

| Değişiklik | Açıklama |
|------------|----------|
| Otomatik SMS filtresi | Toolbar’da **Otomatik SMS** popover — `AUTO_EVENT_KEY_OPTIONS` için çoklu tik; seçili `event_key`’lere göre aktif şablonlar süzülür |
| `event_key` Select | Radix: boş `value=""` kaldırıldı; manuel = `none`; otomatik seçenekler **Otomatik SMS Şablonları** grubu altında |
| Kaldırılan | Sayfa üstündeki «Kurban günü otomatik SMS» kartı (ayar Organizasyon tablosunda) |

Dosya: `sms-islemleri/sablonlari/page.tsx`.

## 5. Teknik düzeltme

- `lib/sms-auto-sender.ts` — `isSacrificeStageAlreadyDone` içinde union index TypeScript hatası (`Record<string, unknown>` cast).

## 6. Veritabanı (`db/` senkron)

Production’da uygulanmış migration’lar repoya eklendi (idempotent):

| Dosya |
|-------|
| `db/tables/tenant_settings/migrations/add_sms_enabled_to_tenant_settings_2026_05_13.sql` |
| `db/tables/tenant_settings/migrations/tenant_settings_add_sms_auto_columns_2026_05_18.sql` |
| `db/tables/sms_templates/migrations/create_sms_templates_2026_05_06.sql` |
| `db/tables/sms_templates/migrations/sms_templates_add_event_key_2026_05_18.sql` |
| `db/tables/sms_notification_events/migrations/create_sms_notification_events_2026_05_18.sql` |
| `db/tables/stage_metrics/migrations/fix_stage_metrics_trigger_year_filter_2026_05_18.sql` |

`table.sql` dosyaları güncel şemayı yansıtır. `lib/sms-auto-sender.ts` içinde `stage_metrics` okuması `stage` kolonuna düzeltildi (`stage_name` / `sacrifice_year` yok).

## İlişkili belgeler

- [sms-admin-and-tenant-flag.md](../sms-admin-and-tenant-flag.md)
- [sms-operations.md](../sms-operations.md)
- [pages/admin-pages.md](../pages/admin-pages.md)
