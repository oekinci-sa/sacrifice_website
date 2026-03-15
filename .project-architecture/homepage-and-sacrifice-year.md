# Homepage Mode ve Sacrifice Year

## homepage_mode

Root `/` sayfası `tenant_settings.homepage_mode` değerine göre farklı içerik gösterir.

| Değer | Gösterilen içerik |
|-------|-------------------|
| anasayfa | Tam anasayfa (Features, Prices, Process, FAQ) |
| thanks | Teşekkürler sayfası |
| takip | Kurbanlık takip sayfası (Queue kartları) |

Varsayılan: `thanks`

## homepage_layout

Tenant bazlı layout seçimi (ileride Golbaşı/Kahramankazan farklı yapı için).

| Değer | Açıklama |
|-------|----------|
| default | Varsayılan layout |
| golbasi | Gölbaşı'na özel layout |
| kahramankazan | Kahramankazan'a özel layout |

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
- `/onizleme/anasayfa` — Anasayfa
- `/onizleme/thanks` — Teşekkürler
- `/onizleme/takip` — Takip
