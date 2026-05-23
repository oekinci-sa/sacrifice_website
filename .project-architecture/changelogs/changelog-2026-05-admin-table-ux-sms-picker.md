# Admin tablolar — SMS hissedar seçici, kurbanlık sayacı, hisse filtresi (2026-05)

## Özet

Üç admin UX iyileştirmesi:

1. **SMS Gönder** sayfasında «Hissedarlardan seç» dropdown’u sayfalı yükleme + kaydırınca daha fazla kayıt (infinite scroll).
2. **Tüm Kurbanlıklar** tablosunda infinite scroll açıkken altta filtrelenmiş toplam kayıt sayısı (Hissedarlar tablosu ile uyumlu).
3. **Tüm Hissedarlar** tablosunda **Hisse Bilgisi** sütununda sıralama ve toolbar faceted filtre (Kurbanlıklar’daki hisse bedeli filtresi ile aynı mantık).

Veritabanı şeması değişmedi.

---

## 1. SMS Gönder — Hissedarlardan seç (`shareholder_pick`)

### Sorun

- Dropdown yalnızca sabit limit (50 / 80) ile tek seferde yüklüyordu; uzun listelerde son kurbanlıklara ulaşılamıyordu.
- API sırası `purchase_time` idi; UI kurban no + isim ile yeniden sıralıyordu — sayfa sınırları tutarsız görünüme yol açabiliyordu.

### Çözüm

| Katman | Dosya | Davranış |
|--------|-------|----------|
| API | `app/api/admin/sms/shareholder-search/route.ts` | `offset`, `limit` (varsayılan 50, max 100). Sıra: `sacrifice_animals(sacrifice_no)` ASC → `shareholder_name` ASC. `!inner` join. Arama: `q` ≥ 2 karakter → `or(shareholder_name.ilike, phone_number.ilike)`. Yanıt: `{ results, hasMore, nextOffset }`. |
| UI | `app/(admin)/kurban-admin/sms-islemleri/components/sms-shareholder-picker.tsx` | İlk sayfa debounced arama (300 ms); liste sonunda `IntersectionObserver` (`rootMargin: 120px`) ile sonraki sayfa; birleştirme + kurban no / isim sıralaması istemci tarafında korunur; çift istek `fetchingMoreRef` ile engellenir. |

### API sözleşmesi

```
GET /api/admin/sms/shareholder-search?year=2026&q=&offset=0&limit=50
```

| Param | Açıklama |
|-------|----------|
| `year` | Zorunlu; `sacrifice_year` |
| `q` | Boş veya 1 harf: tüm liste; ≥ 2 harf: isim/telefon ilike |
| `offset` | Sayfa başlangıcı (0 tabanlı) |
| `limit` | Sayfa boyutu (1–100) |

**Not:** Seçilen hissedarlar (`pickedShareholders`) API limitinden bağımsız; yalnızca dropdown arama sonuçları sayfalanır. `shareholder_pick` hedef tipinde `/api/admin/sms/recipients` çağrılmaz; alıcı listesi seçimden türetilir.

Detay: [sms-operations.md](../sms-operations.md) — «Hissedar araması (picker)» bölümü.

---

## 2. Tüm Kurbanlıklar — tablo altı kayıt sayısı

### Sorun

`CustomDataTable` + `infiniteScroll` kullanıldığında sayfalama footer’ı (`CustomDataTableFooter`) gizleniyordu; «Toplam X adet sonuç bulundu» metni yoktu.

### Çözüm

| Dosya | Değişiklik |
|-------|------------|
| `components/custom-data-components/custom-data-table.tsx` | `infiniteScroll` aktifken: «Toplam {filteredCount} adet sonuç bulundu.»; henüz tüm satırlar DOM’da değilse alt satır «({visibleCount} satır görüntüleniyor)». Sayfalama kontrolleri yine yok (infinite scroll korunur). |

**Sayfa:** `/kurban-admin/kurbanliklar/tum-kurbanliklar` — `infiniteScroll={{ initialCount: 50, step: 50 }}` (mevcut).

Sayım kaynağı: `table.getFilteredRowModel().rows.length` (sütun filtreleri + toolbar araması dahil).

---

## 3. Tüm Hissedarlar — Hisse Bilgisi sıralama ve filtre

### Sorun

- `sacrifice_info` sütunu `enableSorting: false` idi.
- Toolbar’da Kurban No, Ödeme, Teslimat, Vekalet vardı; **Hisse Bilgisi** faceted filtresi yoktu (Kurbanlıklar tablosunda `share_price` filtresi vardı).

### Çözüm

| Dosya | Değişiklik |
|-------|------------|
| `hissedarlar/tum-hissedarlar/components/columns.tsx` | `sacrifice_info`: `enableSorting: true`, `sortingFn: sortingFunctions.number`. Sıralama anahtarı: sabit fiyat → `sacrifice.share_price`; canlı baskül → `live_scale_total_price`. `filterFn`: `share_price` değerine göre çoklu seçim (Kurbanlıklar `share_price` kolonu ile aynı kalıp). |
| `hissedarlar/tum-hissedarlar/components/shareholder-filters.tsx` | Veriden türetilen TL kademeleri (`sharePriceOptions`); `DataTableFacetedFilter` — başlık `H.sacrifice_info` («Hisse Bilgisi»). Canlı baskül satırları `share_price` null olduğu için filtre seçeneklerinde yalnız sabit fiyat kademeleri görünür. |

Hücre gösterimi değişmedi: `AdminSacrificeHisseBedeliTableCell`.

---

## İlgili dosyalar (özet)

```
app/api/admin/sms/shareholder-search/route.ts
app/(admin)/kurban-admin/sms-islemleri/components/sms-shareholder-picker.tsx
components/custom-data-components/custom-data-table.tsx
app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/columns.tsx
app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/shareholder-filters.tsx
```

## Dokümantasyon güncellemeleri

- [sms-operations.md](../sms-operations.md) — `shareholder-search` route
- [pages/admin-pages.md](../pages/admin-pages.md) — SMS gönder, Hissedarlar, Kurbanlıklar notları
- [components.md](../components.md) — `CustomDataTable` infinite scroll footer
- [features.md](../features.md) — Admin Tablo Sayfaları maddeleri
