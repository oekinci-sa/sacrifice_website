# 2026-03 Homepage Evre Yönetimi

## Özet

Anasayfa içeriği ve layout'u artık admin panelinden `tenant_settings.homepage_mode` alanı üzerinden dinamik olarak yönetilmektedir. Önceki sabit `GOLBASI_TENANT_ID` kontrolü kaldırılmış; tüm tenant'lar için tek tip, DB güdümlü bir yapı kurulmuştur.

## Değişiklikler

### Veritabanı

- `tenant_settings.homepage_mode` CHECK kısıtı genişletildi:
  - Yeni değerler: `pre_campaign`, `launch_countdown`, `live`, `thanks`, `follow_up`
  - Geriye dönük uyumluluk: `anasayfa`, `takip` korundu
  - Varsayılan: `pre_campaign`
- `tenant_settings.homepage_layout` kolonu **kaldırıldı** (hiçbir zaman kullanılmamıştı)

### TypeScript Tipleri

- `HomepageMode` tipi (`lib/homepage-settings.ts`, `types/index.ts`) yeni değerleri içerecek şekilde güncellendi
- `HomepageLayout` tipi ve `TenantSettings.homepage_layout` alanı kaldırıldı

### Routing (`app/(root)/`)

| Dosya | Değişiklik |
|-------|------------|
| `layout.tsx` | `getHomepageSettings()` ile `mode` okunur; `live`/`anasayfa` → `PublicLayout`, diğerleri → `TakipLayout` |
| `page.tsx` | `switch(mode)` ile içerik bileşeni seçilir |

### Yeni Bileşenler

| Bileşen | Evre | Açıklama |
|---------|------|----------|
| `TakipHomePreCampaignAnnouncement` | `pre_campaign` | Duyuru metni + "Bana Haber Ver" formu |
| `TakipHomeLaunchCountdown` | `launch_countdown` | "Yakında Açılıyor" + kısa duyuru + `Prices` (Hisse Bedellerimiz başlığı altta); hisseal devre dışı |

### Değiştirilen Bileşenler

- `TakipHomeContent`: artık `pre_campaign` evresini render eder (duyuru + form)
- `Prices`: `disableHissealNavigation` prop'u eklendi — `true` olduğunda fiyat kartlarına tıklamak hisseal'a yönlendirmez

### Admin UI

- `editable-tenant-cells.tsx`: `HOMEPAGE_MODE_OPTIONS` güncellendi
- `tenant-settings-edit-dialog.tsx`: `SelectItem` listesi güncellendi; `HomepageLayout` tipi ve "Anasayfa Düzeni" alanı kaldırıldı
- `columns.tsx`: `homepage_layout` sütunu kaldırıldı; `TenantSettingRow.homepage_layout` alanı kaldırıldı
- `tenant-settings-toolbar.tsx`: `TENANT_COLUMN_HEADER_MAP`'ten `homepage_layout` kaldırıldı

### API

- `app/api/admin/tenant-settings/[tenantId]/route.ts`: `UPDATABLE_FIELDS`'dan `homepage_layout` kaldırıldı
- `app/api/tenant-settings/route.ts`: `homepage_layout` select ve response'dan kaldırıldı

### Dokümantasyon

- `homepage-and-sacrifice-year.md`: Tüm evre tablosu, layout seçimi ve bileşen listesi güncellendi
- `features.md`: Homepage Evre Yönetimi bölümü eklendi

## Evre → İçerik Özeti

| `homepage_mode` | Layout | İçerik |
|-----------------|--------|--------|
| `pre_campaign` | Minimal | Duyuru metni + Bana Haber Ver formu |
| `launch_countdown` | Minimal | Yakında Açılıyor başlığı + Fiyat listesi |
| `live` | Tam | Tam anasayfa (Features, Prices, Process, FAQ) |
| `thanks` | Minimal | Teşekkürler sayfası |
| `follow_up` | Minimal | Kurbanlık takip (Queue kartları) |
