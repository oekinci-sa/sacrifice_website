# Kurban Günü İstatistikleri, arıza kayıtları ve public duyuru (2026-05)

## Özet

Kurban günü operasyon takibi için **Kurban Günü İstatistikleri** admin sayfası eklendi; kesinti (arıza) kayıtları `stage_downtime_events` tablosunda tutulup aşama ortalama sürelerinden düşülür. Tenant bazlı **arıza duyurusu** public ve takip layout’larında dialog + sticky banner olarak gösterilir. Eski **Aşama Metrikleri** sayfası kaldırıldı.

## 1. Admin sayfa — `/kurban-admin/kurbanliklar/kurban-gunu-istatistikleri`

**Menü:** Kurbanlıklar alt menüsü (SMS İşlemleri gibi):
- Tüm Kurbanlıklar
- **Kurban Günü İstatistikleri**

**Yetki:** editor, admin, super_admin.

| Bölüm | İçerik |
|-------|--------|
| A — Aşama durumu | 3 kart: güncel sıra no + ortalama süre (`GET /api/get-stage-metrics`, `useStageMetricsStore`) |
| B — Kurbanlıklar | Read-only tablo: No, Tür, Hisse (dolu/toplam), Kesim / Parçalama / Teslimat saatleri (`GET /api/get-sacrifice-animals`) |
| C — Arıza kayıtları | CRUD tablo + dialog; aşama, başlangıç/bitiş (HH:MM), otomatik süre (dk), not |
| D — Arıza duyurusu | Switch + metin → `PUT /api/admin/incident-banner` |

Dosya: `app/(admin)/kurban-admin/kurbanliklar/kurban-gunu-istatistikleri/page.tsx`

## 2. Arıza kayıtları (`stage_downtime_events`)

| Kolon | Açıklama |
|-------|----------|
| `tenant_id`, `sacrifice_year` | Tenant + aktif kurban yılı |
| `affected_stage` | `slaughter` \| `butcher` \| `delivery` |
| `started_time`, `ended_time` | TIME (TR saati, HH:MM) |
| `duration_minutes` | Client hesaplar; API’ye gönderilir |
| `note` | İsteğe bağlı |
| `created_by` | Oturum e-postası |

**Ortalamadan düşme kuralı** (`update_stage_metrics.sql` tetikleyicileri):

| Aşama metrik | Hangi arızalar düşülür |
|--------------|------------------------|
| `slaughter_stage` | yalnızca `slaughter` |
| `butcher_stage` | `slaughter` + `butcher` |
| `delivery_stage` | `slaughter` + `butcher` + `delivery` |

Çakışan aralıklar (aynı aşama filtresi içinde) **birleştirilir** (gaps-and-islands); toplam kesinti saniyesi ham süreden çıkarılır.

**change_logs:** Bu tablo audit’e dahil değildir.

## 3. API route’ları

| Route | Method | Yetki | Açıklama |
|-------|--------|-------|----------|
| `/api/admin/stage-downtime` | GET | editor+ | Yıl + tenant arıza listesi |
| `/api/admin/stage-downtime` | POST | editor+ | Yeni kayıt |
| `/api/admin/stage-downtime/[id]` | PUT | editor+ | Güncelle |
| `/api/admin/stage-downtime/[id]` | DELETE | editor+ | Sil |
| `/api/admin/incident-banner` | GET, PUT | editor+ | Banner aç/kapat + metin |
| `/api/public/incident-banner` | GET | açık | Public polling (~60 sn) |

## 4. Public arıza duyurusu (`tenant_settings`)

| Kolon | Açıklama |
|-------|----------|
| `incident_banner_enabled` | BOOLEAN, default FALSE |
| `incident_banner_message` | TEXT |

**Bileşen:** `components/layout/incident-banner.tsx` (`IncidentBannerWrapper`)

| Davranış | Açıklama |
|----------|----------|
| İlk ziyaret | Banner açıksa modal dialog |
| Dialog kapanınca | Turuncu sticky şerit (navbar altı / üstü) |
| Mesaj değişince | `sessionStorage` hash farklı → dialog yeniden açılır |
| Polling | `/api/public/incident-banner`, 60 sn |

**Layout:** `(public)/layout.tsx`, `(takip)/layout.tsx` — admin layout’a eklenmez.

**Branding:** `TenantBranding.incident_banner_enabled`, `incident_banner_message` — `lib/tenant-branding.ts`, `lib/tenant-branding-defaults.ts`.

## 5. Sıra numarası sınırları (ilgili iyileştirme)

Takip / operatör sıra ekranları (`/kesimsirasi`, `/parcalamasirasi`, `/teslimatsirasi`, takip kartları):

- Henüz işlem başlamadıysa gösterilen numara **1** (`lib/queue-display-number.ts`, `normalizeQueueDisplayNumber`)
- Artır/azalt: min **1**, max tenant’ın en yüksek kurban numarası (`GET /api/get-stage-metrics` → `max_sacrifice_number`)
- Sınır aşımında toast uyarısı

## 6. Kaldırılanlar

| Öğe | Not |
|-----|-----|
| `/kurban-admin/asama-metrikleri` | Sayfa + `components/` silindi |
| Sidebar linki | Zaten yoktu; Kurbanlıklar alt menüsüne taşındı |

Aşama metrik **okuma/güncelleme API’leri** (`get-stage-metrics`, `update-stage-metrics`) ve `stage_metrics` tablosu aynen kullanılmaya devam eder.

## 7. Veritabanı (`db/` senkron)

| Dosya |
|-------|
| `db/tables/stage_downtime_events/table.sql` |
| `db/tables/stage_downtime_events/migrations/create_stage_downtime_events_2026_05_22.sql` |
| `db/tables/tenant_settings/migrations/tenant_settings_incident_banner_2026_05_22.sql` |
| `db/tables/tenant_settings/table.sql` — `incident_banner_*` kolonları |
| `db/tables/stage_metrics/functions_and_triggers/update_stage_metrics.sql` — arıza düşme + çakışma birleştirme |
| `db/tables/stage_metrics/migrations/fix_stage_metrics_downtime_merge_2026_05_22.sql` — nested window fix notu |

**Production düzeltme (2026-05-22):** İlk downtime merge SQL’i `SUM(...) OVER` içinde `MAX(...) OVER` kullanıyordu → `POST /api/update-sacrifice-timing` hata `42P20 window function calls cannot be nested`. Çözüm: `ordered` + `island_start` iki aşamalı CTE.

## 8. Realtime

- `stage_metrics` değişiklikleri takip sayfalarında mevcut Supabase Realtime aboneliği ile güncellenmeye devam eder.
- Arıza banner: Realtime yok; public polling (60 sn).

## İlişkili belgeler

- [pages/admin-pages.md](../pages/admin-pages.md)
- [user-flows.md](../user-flows.md)
- [role-permissions.md](../role-permissions.md)
- [controls.md](../controls.md)
