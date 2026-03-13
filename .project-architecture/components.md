# Proje Bileşenleri

Bu dosya projede oluşturulan özel bileşenleri ve özelliklerini listeler. `components/ui/` altındaki Shadcn tabanlı primitifler burada yer almaz.

---

## custom-data-components/

### CustomDataTable
- **Amaç:** Sayfalama, sıralama, filtreleme destekli veri tablosu
- **Props:** `columns`, `data`, `pageSizeOptions`, `tableSize`, `filters`, `initialState`
- **Özellikler:** TanStack Table, sütun görünürlüğü, sayfa boyutu seçimi
- **Kullanım:** Kurbanlıklar, Hissedarlar, Değişiklik Kayıtları, Rezervasyonlar, Aşama Metrikleri sayfaları

### CustomTableHeader / CustomTableBody
- CustomDataTable içinde kullanılan header ve body bileşenleri
- Sıralama, sütun gizleme dropdown desteği

### CustomDataTableFooter
- Sayfa navigasyonu, sayfa boyutu seçimi
- "X-Y / Toplam" formatında bilgi gösterimi

### CustomLink
- **Amaç:** Standart link stili (font-medium, hover:text-primary)
- **Props:** `href`, `children`, `className`, `target`

### CustomTabs
- **Amaç:** Alt çizgili tab geçişi (border-bottom stil)
- **Props:** `tabs: { value, label, content }[]`
- Shadcn Tabs üzerine özelleştirilmiş görünüm

### StatCardWithProgress
- **Amaç:** İstatistik kartı, opsiyonel progress bar
- **Props:** `title`, `value`, `maxValue`, `suffix`, `format` (currency/number), `actionLink`, `type` (default/warning)
- Genel Bakış özet kartları için kullanılır

---

## common/

### ShareholderLookup
- **Amaç:** Telefon numarası ile hissedar arama
- **Props:** `onResultsFound?: (shareholders) => void`
- **Özellikler:** TR telefon formatı (05xx xxx xx xx), doğrulama, arama sonuçları listesi, ShareholderDetails entegrasyonu
- **Kullanım:** Hisse Sorgula sayfası

### EmptySharesBadge
- **Amaç:** Kalan boş hisse sayısını gösteren badge
- **Props:** `className`, `textClassName`, `size` (sm/md/lg)
- **Özellikler:** useEmptyShareCount + useSacrificeStore ile gerçek zamanlı güncelleme
- **Metin:** "Son X Hisse" veya "Tüm hisseler tükendi"

---

## layout/

### Header
- Logo, DesktopNavigation, "Hemen al" butonu, MobileNavigation
- Sticky, container, responsive

### HeaderMinimal
- Minimal header varyantı (daha az öğe)

### Footer / FooterMinimal
- Site alt bilgisi, linkler

### Logo
- Proje logosu bileşeni

### DesktopNavigation / MobileNavigation
- Masaüstü ve mobil menü navigasyonu

---

## providers/

### StoreRealtimeProvider
- **Amaç:** Tüm store'ları başlatır ve realtime aboneliklerini kurar
- **İçerik:** fetchShareholders, fetchTransactions, refetchSacrifices
- Layout seviyesinde kullanılır

### ShareholderDataProvider
- Hissedarlar store'unu başlatır, realtime abone eder
- `enableRealtime` / `disableRealtime` cleanup ile

### SacrificeDataProvider
- Kurbanlıklar store'unu başlatır, realtime abone eder
- `subscribeToRealtime` / `unsubscribeFromRealtime` cleanup ile

### ThemeProvider
- **Amaç:** Tema sağlayıcı (passthrough). Geçmişte client-side tema fetch yapıyordu; FOUC önlemek için tema artık sunucuda enjekte ediliyor.
- **Kullanım:** `Providers` zincirinde; ileride client-side tema değiştirme gerekirse buraya logic eklenebilir.

---

## theme/

### ThemeStyles
- **Amaç:** Sunucu tarafı tema enjeksiyonu – FOUC (flash) önleme
- **Tür:** Server Component (async)
- **Akış:** `headers()` → tenant_id → `tenant_settings.theme_json` → `:root { --primary: ...; }` inline style
- **Kullanım:** `app/layout.tsx` içinde `<head>` altında render edilir
- **Detay:** `.project-architecture/colors.md` içinde "Tenant Tema Override" bölümüne bak

---

## ui/ (proje özelleştirmeleri)

### Loading
- **Props:** `text?: string` (varsayılan: "Yükleniyor...")
- Loader2 ikonu + metin, merkez hizalı

### ProgressCard
- **Props:** `title`, `value`, `maxValue`
- Kart içinde değer, yüzde ve Progress bar

### Field
- Form alanı wrapper (label, hata mesajı vb.)

### NotFound
- 404 / bulunamadı sayfası bileşeni
