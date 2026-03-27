# Homepage Mode ve Sacrifice Year

## homepage_mode

Root `/` sayfası `tenant_settings.homepage_mode` değerine göre farklı içerik ve layout gösterir.

| Değer | Admin Etiketi | Layout | Gösterilen İçerik |
|-------|---------------|--------|-------------------|
| `pre_campaign` | Ön Bilgilendirme / Bana Haber Ver | Minimal (TakipLayout) | Duyuru metni + "Bana Haber Ver" formu (`TakipHomeContent`) |
| `launch_countdown` | Yakında Açılıyor | Minimal (TakipLayout) | "Yakında Açılıyor" + kısa duyuru + `Prices` (Hisse Bedellerimiz başlığı altta); md+ grid 4 sütun, son satır ortalı; hisseal devre dışı |
| `live` | Satış Aktif | Tam (PublicLayout) | Tam anasayfa: Features, Prices, Process, FAQ (`AnasayfaContent`) |
| `thanks` | Teşekkür | Minimal (TakipLayout) | Teşekkürler sayfası (`ThanksContent`) |
| `follow_up` | Takip / Kesim | Minimal (TakipLayout) | Kurbanlık takip sayfası — Queue kartları (`TakipContent`) |
| `anasayfa` | *(geriye dönük)* | Tam (PublicLayout) | `live` ile aynı |
| `takip` | *(geriye dönük)* | Minimal (TakipLayout) | `follow_up` ile aynı |

Varsayılan: `pre_campaign`

### Layout seçimi

`app/(root)/layout.tsx`: `mode === "live" || mode === "anasayfa"` → `PublicLayout` (tam header/footer); diğer tüm modlar → `TakipLayout` (minimal header/footer).

### İçerik bileşenleri

| Bileşen | Dosya |
|---------|-------|
| `TakipHomeContent` | `app/(takip)/components/takip-home-content.tsx` |
| `TakipHomePreCampaignAnnouncement` | `app/(takip)/components/takip-home-pre-campaign-announcement.tsx` |
| `TakipHomeLaunchCountdown` | `app/(takip)/components/takip-home-launch-countdown.tsx` |
| `AnasayfaContent` | `app/(public)/onizleme/anasayfa/page.tsx` |
| `ThanksContent` | `app/(public)/onizleme/thanks/page.tsx` |
| `TakipContent` | `app/(takip)/(takip)/page-takip.tsx` |

### Admin yönetimi

Organizasyon Ayarları sayfasında (`/kurban-admin/tenant-ayarlari`) **Anasayfa Modu** sütunundan veya düzenleme dialogundan değiştirilebilir.

## sacrifice_year

- **Kural:** Bayramın ilk gününün düştüğü miladi yıl (örn. 2025, 2026)
- **Kolon:** `sacrifice_animals.sacrifice_year` (SMALLINT, NOT NULL)
- **Unique constraint:** `(tenant_id, sacrifice_year, sacrifice_no)`

### Tenant'a özgü yıl (Public sayfalar)

- **Kaynak:** `tenant_settings.active_sacrifice_year` (SMALLINT, tenant bazlı)
- **Çözümleme sırası:** `resolveSacrificeYearForTenant()` ([lib/sacrifice-year-resolver.ts](lib/sacrifice-year-resolver.ts))
  1. URL `?year=` parametresi varsa onu kullan
  2. `tenant_settings.active_sacrifice_year`
  3. `sacrifice_animals` MAX(sacrifice_year)
- **Fallback yok:** Yıl bulunamazsa 500 hata döner (`NO_SACRIFICE_YEAR_ERROR`)
- **Admin:** Varsayılan = MAX(sacrifice_year); veri yoksa `tenant_settings.active_sacrifice_year`; ikisi de yoksa 500

### Diğer API'lar (admin, create-sacrifice vb.)

- `getDefaultSacrificeYear()` ([lib/constants/sacrifice-year.ts](lib/constants/sacrifice-year.ts)) — `SACRIFICE_YEAR` env veya `new Date().getFullYear()`

## Önizleme Route'ları

DB'ye dokunmadan içerik önizlemesi:
- `/onizleme` — Liste
- `/onizleme/anasayfa` — Anasayfa (live modu)
- `/onizleme/thanks` — Teşekkürler
- `/onizleme/takip` — Takip
