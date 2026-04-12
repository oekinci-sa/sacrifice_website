# Admin tablolar — sütun / filtre etiketleri tek kaynak (2026-04)

## Özet

Kurbanlıklar, Tüm Hissedarlar, Ödemeler ve Uyumsuz hisseler ekranlarında **tablo başlıkları**, **filtre butonları**, **Sütunlar** popover’ı ve **Excel’e aktar** çıktısı için kullanılan metinler dağınıktı; kullanıcı isteği doğrultusunda **terminoloji birleştirildi** ve **tek kaynaklı** `Record<string, string>` haritalarına taşındı.

## Sorun (neydi?)

| Belirti | Açıklama |
|--------|-----------|
| Aynı anlam, farklı yazım | Ör. kurban sırası: «Kur. Sır.» / «Kurban No»; ödeme özeti: «Ödeme Durumu» / «Ödeme». |
| Fiyat + kg sütunu | Bazı yerlerde «Hisse Bedeli», hedeflenen birleşik başlık «Hisse Bilgisi». |
| Not sütunu | Uyumsuz hisselerde «Kurbanlık Notları», diğer tablolarda «Notlar». |
| Bakım maliyeti | Başlık, filtre `title`, `ColumnSelectorPopover`, `exportTableToExcel` ayrı ayrı güncellenince tutarsızlık riski. |

**Teknik hata değil:** Çalışma zamanı bug’ı yoktu; sorun **UX / terminoloji tutarsızlığı** ve **kod tekrarı**.

## Çözüm (nasıl?)

1. **Modül başına bir harita** (`lib/admin-table-column-labels/`):
   - `kurbanliklar.ts` — `kurbanliklarColumnHeaderLabels`
   - `hissedarlar.ts` — `hissedarlarColumnHeaderLabels` (Tüm Hissedarlar + Excel; `hissedarlar-table-toolbar.tsx` içinde `SHAREHOLDER_COLUMN_HEADER_MAP` bu nesneye eşitlenir)
   - `odemeler.ts` — `odemelerColumnHeaderLabels`
   - `uyumsuz-hisseler.ts` — `uyumsuzHisselerColumnHeaderLabels`

2. **Tüketim:** İlgili `columns.tsx` dosyalarında `header: ...` değerleri bu haritalardan; `sacrifice-filters.tsx`, `shareholder-filters.tsx`, `payment-filters.tsx` içinde filtre tetikleyici metinleri; `ToolbarAndFilters` / `odemeler/page.tsx` içinde `columnHeaderMap` ve `exportTableToExcel(..., map)`.

3. **Sonuç:** Yeni metin değişikliği için önce ilgili haritada tek satır güncellenir; tablo, filtre, sütun seçici ve Excel aynı kalır.

## Terminoloji (hedef metinler)

| Alan | Önceki örnekler | Hedef |
|------|------------------|--------|
| Kurban sırası | Kur. Sır. | **Kurban No** |
| Ödeme özeti sütunu / filtre | Ödeme Durumu | **Ödeme** |
| Fiyat + kg (hisse bilgisi) | Hisse Bedeli | **Hisse Bilgisi** |
| Notlar | Kurbanlık Notları (uyumsuz) | **Notlar** |
| Teslimat (hissedar filtre) | Teslimat Noktası | **Teslimat Tercihi** (sütun etiketi ile hizalı) |

## Dokunulan kod (referans)

- `lib/admin-table-column-labels/*.ts` — yeni / güncel haritalar
- `app/(admin)/kurban-admin/kurbanliklar/tum-kurbanliklar/components/columns.tsx`, `sacrifice-filters.tsx`, `ToolbarAndFilters.tsx`
- `app/(admin)/kurban-admin/hissedarlar/tum-hissedarlar/components/columns.tsx`, `hissedarlar-table-toolbar.tsx`, `shareholder-filters.tsx`
- `app/(admin)/kurban-admin/hissedarlar/odemeler/page.tsx`, `odemeler/components/payment-filters.tsx`
- `app/(admin)/kurban-admin/uyumsuz-hisseler/components/columns.tsx`

## İlişkili mimari not

- Sütun **sırası** ve `storageKey` davranışı: [changelog-2026-03-admin-column-reorder.md](changelog-2026-03-admin-column-reorder.md)
