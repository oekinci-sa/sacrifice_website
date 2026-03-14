# Çözüm Rehberi – Veri Arşivleme, Sayfa Testi, Tenant Bazlı Anasayfa

Bu doküman aşağıdaki sorulara cevap verir:
1. Geçen senenin verilerini her sene saklamak
2. Bayram/thanks sayfalarını test ederken sayfa adları
3. Port/tenant bazlı farklı anasayfalar
4. page-anasayfa canlıya almadan önce önizleme
5. Tenant bazlı bağımsız sayfa açma (biri yarın, diğeri 1 hafta sonra)

---

## 1. Geçen Senenin Verilerini Her Sene Saklamak

### Mevcut Durum
- `sacrifice_animals`, `shareholders`, `reservation_transactions` vb. tablolarda `tenant_id` var ama **yıl bilgisi yok**
- Tüm veriler tek havuzda; yıl bazlı filtreleme yapılamıyor

### Önerilen Çözüm: `sacrifice_year` Kolonu

**Adım 1: Migration – Yıl kolonu ekle**

```sql
-- sacrifice_animals'a sacrifice_year ekle (örn. 2024, 2025)
ALTER TABLE sacrifice_animals ADD COLUMN sacrifice_year SMALLINT;

-- Mevcut verileri geçen yıla ata (örnek: 2024)
UPDATE sacrifice_animals SET sacrifice_year = 2024 WHERE sacrifice_year IS NULL;

-- NOT NULL yap (yeni kayıtlar için)
ALTER TABLE sacrifice_animals ALTER COLUMN sacrifice_year SET NOT NULL;

-- Index
CREATE INDEX idx_sacrifice_animals_year_tenant ON sacrifice_animals (tenant_id, sacrifice_year);
```

**Adım 2: İlişkili tablolara yıl ekle**
- `shareholders`, `reservation_transactions` zaten `sacrifice_id` ile bağlı → `sacrifice_year` dolaylı olarak gelir
- Yıl bazlı raporlama için `sacrifice_year` view'larda veya sorgularda kullanılabilir

**Adım 3: Yeni sezon başlangıcı**
- Her yeni bayram sezonunda yeni `sacrifice_year` ile kayıt açılır
- Admin panelde "Sezon / Yıl" seçimi eklenebilir
- Varsayılan: `new Date().getFullYear()`

**Adım 4: Arşiv görüntüleme**
- Admin panelde "Geçmiş sezonlar" filtresi
- Sadece okuma; eski veriler değiştirilmez

---

## 2. Bayram / Thanks Sayfalarını Test Ederken Sayfa Adları

### Mevcut Durum
- `page.tsx` → canlı sayfa
- `page-thanks.tsx` → test için ayrı dosya (Next.js route değil)
- Dosya adı değiştirerek test/canlı geçişi yapılıyor

### Önerilen Çözüm: Query Param veya Ayrı Route

**Seçenek A: Query param ile önizleme**
```
/takip?preview=thanks   → page-thanks içeriği
/takip?preview=bayram   → page-bayram içeriği
/takip                  → normal page.tsx
```

**Seçenek B: Ayrı test route'ları (önerilen)**
```
/takip              → canlı (page.tsx)
/takip/onizleme/thanks  → test (page-thanks içeriği)
/takip/onizleme/bayram  → test (page-bayram içeriği)
```

Böylece:
- Canlı sayfa hiç değişmez
- Test sayfaları `/takip/onizleme/*` altında kalır
- Canlıya alırken sadece `page.tsx` içeriğini değiştirirsiniz

---

## 3. Port/Tenant Bazlı Farklı Anasayfalar

### Mevcut Durum
- Port: 3000=test, 3001=kahramankazan, 3002=golbasi
- Root `/` şu an `(takip)/page.tsx` ile sunuluyor
- `page-anasayfa.tsx` route değil; kullanılmıyor

### Önerilen Çözüm: Tenant Bazlı Anasayfa Seçimi

**Adım 1: `tenant_settings` tablosuna `homepage_mode` ekle**

```sql
ALTER TABLE tenant_settings ADD COLUMN homepage_mode TEXT 
  DEFAULT 'anasayfa' 
  CHECK (homepage_mode IN ('anasayfa', 'thanks', 'takip', 'bayram'));
```

**Adım 2: Root route'u tenant-aware yap**

`app/(public)/page.tsx` oluştur (veya mevcut root'u değiştir):

```tsx
// app/(public)/page.tsx
import { getTenantId } from '@/lib/tenant';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AnasayfaContent from './(anasayfa)/page-anasayfa';
import ThanksContent from '@/app/(takip)/page-thanks';
import TakipContent from '@/app/(takip)/(takip)/page-takip';

export default async function HomePage() {
  const tenantId = getTenantId();
  const { data } = await supabaseAdmin
    .from('tenant_settings')
    .select('homepage_mode')
    .eq('tenant_id', tenantId)
    .single();

  const mode = data?.homepage_mode ?? 'anasayfa';

  switch (mode) {
    case 'thanks':
      return <ThanksContent />;
    case 'takip':
      return <TakipContent />;
    case 'anasayfa':
    default:
      return <AnasayfaContent />;
  }
}
```

**Adım 3: Layout**
- Root `/` için `(public)` layout kullanılır (Header + Footer)
- `(takip)` sayfaları kendi layout'unu kullanır (HeaderMinimal)

**Not:** Şu an `/` route'u `(takip)/page.tsx` tarafından alınıyor. Bunu `(public)/page.tsx` ile değiştirmek için:
- `app/(public)/page.tsx` ekleyin
- `app/(takip)/page.tsx`'i kaldırın veya `/takip` route'una taşıyın

---

## 4. page-anasayfa Canlıya Almadan Önce Önizleme

### Seçenek A: Ayrı önizleme route'u
```
/onizleme/anasayfa  → page-anasayfa içeriği (sadece geliştirme/test)
```

Middleware ile sadece localhost'ta açılabilir:

```ts
// middleware.ts - /onizleme/* sadece localhost
if (req.nextUrl.pathname.startsWith('/onizleme') && !host.includes('localhost')) {
  return NextResponse.redirect(new URL('/', req.url));
}
```

### Seçenek B: Query param
```
/?preview=anasayfa  → page-anasayfa
```
- Sadece `?preview=anasayfa` varken anasayfa içeriği gösterilir
- Production'da bu param'ı devre dışı bırakabilirsiniz

### Seçenek C: Admin panelden "Önizleme" butonu
- Admin panelde "Anasayfa önizlemesi" linki
- Yeni sekmede `/onizleme/anasayfa` veya `/?preview=anasayfa` açar

---

## 5. Tenant Bazlı Bağımsız Sayfa Açma (Biri Yarın, Diğeri 1 Hafta Sonra)

### Sorun
- Sayfalar ortak kodda; birini açınca diğeri de açılıyor

### Çözüm: `tenant_settings.homepage_mode`

Her tenant için DB'de farklı değer:

| tenant_id | homepage_mode | Açıklama |
|-----------|---------------|----------|
| golbasi   | anasayfa      | Yarın açılacak – tam anasayfa |
| kahramankazan | thanks     | 1 hafta sonra – "Teşekkürler" sayfası |

**Yönetim:**
1. Admin panelde tenant bazlı "Anasayfa modu" ayarı
2. Veya doğrudan SQL:
   ```sql
   UPDATE tenant_settings SET homepage_mode = 'anasayfa' WHERE tenant_id = 'golbasi-uuid';
   UPDATE tenant_settings SET homepage_mode = 'thanks' WHERE tenant_id = 'kahramankazan-uuid';
   ```

Böylece:
- Aynı kod tabanı
- Tenant bazlı farklı anasayfa
- Golbaşı yarın anasayfa, Kahramankazan 1 hafta sonra

---

## Uygulama Özeti

| Konu | Önerilen Adım |
|------|----------------|
| Yıllık veri | `sacrifice_year` kolonu + migration |
| Test sayfaları | `/takip/onizleme/thanks` gibi ayrı route'lar |
| Port bazlı anasayfa | `tenant_settings.homepage_mode` + root page'de switch |
| Önizleme | `/onizleme/anasayfa` veya `?preview=anasayfa` |
| Bağımsız açılış | `homepage_mode` tenant bazlı DB'de |

---

## Dosya Değişiklikleri (Özet)

1. **DB:** `tenant_settings` → `homepage_mode`, `sacrifice_animals` → `sacrifice_year`
2. **app/(public)/page.tsx:** Yeni root sayfa, tenant'a göre içerik seçimi
3. **app/(takip)/onizleme/thanks/page.tsx:** Test için thanks sayfası
4. **middleware:** `/onizleme` sadece localhost (opsiyonel)
