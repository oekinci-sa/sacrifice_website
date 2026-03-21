# Admin tablolar — sütun sırası (2026-03)

## Özet
Admin panelindeki tüm `CustomDataTable` kullanımlarında sütun sırasının başlıktan sürüklenerek değiştirilmesi, öngörülebilir bırakma ve kalıcılık için yapılandırma ve dokümantasyon tamamlandı.

## Teknik

### `CustomTableHeader` (`components/custom-data-components/custom-table-header.tsx`)
- Sütunlar arası bırakma: hedef başlık hücresinde imlecin **sol / sağ yarısına** göre hedefin **öncesine** veya **sonrasına** ekleme (`reorderWithInsertEdge` + `insertAfterFromPointer`).
- Sürüklerken **dikey çizgi** göstergesi (`before` | `after` kenarı); satırdan çıkınca veya `dragend` ile temizlenir.
- `security_code` ve `actions` sütunları yeniden sıralamaya dahil değil.
- Özel `header` bileşenlerinde sürükleme önizlemesi için `columnHeaderLabels` (sayfa bazlı map) kullanımı.

### `CustomDataTable` (`components/custom-data-components/custom-data-table.tsx`)
- `storageKey` verildiğinde: sütun görünürlüğü ve sıra `localStorage` içinde **kullanıcı id** eki ile saklanır (`table-column-visibility-{key}-{userId}`, sıra için `...-order`).
- Boş sıra = varsayılan tanım sırası (`effectiveColumnOrder`).

### Admin sayfalar — `storageKey` listesi
| Sayfa / bağlam | `storageKey` |
|----------------|--------------|
| Tüm Kurbanlıklar | `kurbanliklar` |
| Tüm Hissedarlar | `hissedarlar` |
| Ödemeler | `odemeler` |
| Teslimatlar | `teslimatlar` |
| Rezervasyonlar | `rezervasyonlar` |
| Değişiklik kayıtları | `degisiklik-kayitlari` |
| Aşama metrikleri | `asama-metrikleri` |
| Uyumsuz hisseler — Bilinmeyenler | `uyumsuz-hisseler-bilinmeyenler` |
| Uyumsuz hisseler — Bilinenler | `uyumsuz-hisseler-bilinenler` |
| İletişim mesajları | `iletisim-mesajlari` |
| Reminder talepleri | `reminder-talepleri` |
| Kullanıcı yönetimi | `kullanici-yonetimi` |
| Tenant ayarları | `tenant-ayarlari` |

### `ColumnSelectorPopover` (Tüm Hissedarlar, Kurbanlıklar, Ödemeler, Teslimatlar)
- **Varsayılan sütun düzenine dön:** `onColumnOrderChange([])` — kayıtlı sıfırlanır, tablo tanım sırasına döner.

## Cursor kuralları
- `.cursor/rules/admin-column-reorder.mdc` — `storageKey` zorunluluğu ve davranış özeti.
- `.cursor/rules/admin-tables.mdc` — güncellendi (sütun sırası + popover notları).
- `.cursor/rules/table-structure.mdc` — madde 7: `storageKey`.

## Public
- `app/(public)/.../form-view.tsx` içindeki `CustomDataTable` kasıtlı olarak `storageKey` kullanmayabilir (admin dışı).
