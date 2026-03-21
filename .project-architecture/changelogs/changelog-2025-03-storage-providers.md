# Changelog: localStorage Kullanıcı Bazlı, Provider Konsolidasyonu

**Tarih:** 2025-03-16

## 1. localStorage Kullanıcı Bazlı

### Önceki Durum
- Tablo sütun görünürlüğü ve sırası `table-column-visibility-{storageKey}` ile saklanıyordu
- Aynı tarayıcıda tüm kullanıcılar aynı tercihleri paylaşıyordu

### Yeni Durum
- Key formatı: `table-column-visibility-{storageKey}-{userId}` (giriş yoksa `-anon`)
- Her kullanıcı kendi sütun tercihlerini görür
- CustomDataTable `useSession()` ile userId alır

### Etkilenen Tablolar
- Hissedarlar (`storageKey="hissedarlar"`)
- Ödemeler (`storageKey="odemeler"`)
- Kurbanlıklar (`storageKey="kurbanliklar"`)

### Not
Mevcut kullanıcıların eski key'deki tercihleri artık okunmaz; varsayılan sütun düzeni uygulanır.

---

## 2. Supabase Realtime eventsPerSecond Kaldırıldı

- `eventsPerSecond: 10` parametresi deprecated (Supabase dokümantasyonu)
- Rate limiting artık sunucu tarafında (Dashboard → Realtime Settings)
- `utils/supabaseClient.ts` sadeleştirildi

---

## 3. Provider Konsolidasyonu

### Taşınan Dosyalar
| Eski Konum | Yeni Konum |
|------------|------------|
| components/providers/ThemeProvider.tsx | app/providers/ThemeProvider.tsx |
| components/providers/SacrificeDataProvider.tsx | app/providers/SacrificeDataProvider.tsx |
| components/providers/ShareholderDataProvider.tsx | app/providers/ShareholderDataProvider.tsx |
| components/providers/StoreRealtimeProvider.tsx | app/providers/StoreRealtimeProvider.tsx |

### Provider Hiyerarşisi (Güvenlik)

| Provider | Konum | Veri | Erişim |
|----------|-------|------|--------|
| ThemeProvider | Root | Tema (passthrough) | Tüm sayfalar |
| SacrificeDataProvider | Root | Kurbanlıklar (tenant-scoped) | Tüm sayfalar (hisseal formu için) |
| AdminDataProvider | **Sadece admin layout** | Hissedarlar, rezervasyonlar, değişiklik kayıtları | Sadece /kurban-admin/* |
| TenantBrandingProvider | Public, Takip layout | Logo, iletişim | Public sayfalar |

**Önemli:** Admin-only veri (hissedarlar, rezervasyonlar) sadece AdminDataProvider üzerinden yüklenir; bu provider yalnızca admin layout'ta kullanılır. Public sayfalardan erişilemez.

### Kullanılmayan Provider'lar
- **ShareholderDataProvider:** AdminDataProvider bu işi yapıyor
- **StoreRealtimeProvider:** AdminDataProvider bu işi yapıyor

Bu dosyalar tutarlılık için app/providers/ altında tutuldu; ileride kullanılabilir.
