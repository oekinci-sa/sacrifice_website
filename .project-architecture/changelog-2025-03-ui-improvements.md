# Changelog – UI İyileştirmeleri ve Admin Düzenlemeleri (2025-03)

Bu doküman son dönemde yapılan değişiklikleri özetler.

---

## 1. Tüm Kurbanlıklar – Ödeme Oranı Bölümü

- **Kareler**: Yuvarlatılmış dikdörtgen (`rounded-lg`), yükseklik = genişliğin 1/4’ü (`w-[15px] h-[3.75px]`)
- **Genişlik**: 10px → 15px (yaklaşık %50 artış)
- **Dosya**: `app/(admin)/kurban-admin/kurbanliklar/tum-kurbanliklar/components/columns.tsx`

---

## 2. Hissedarlar Popup (Tüm Kurbanlıklar + Tüm Hissedarlar)

- **Toplam**: Mavi başlık (`text-sac-blue`, `bg-sac-blue` nokta)
- **Ödenen**: Turuncu renk kaldırıldı; `text-muted-foreground` ile nötr gösterim
- **Dosyalar**: `columns.tsx` (kurbanliklar, hissedarlar)

---

## 3. Hissedar Silindiğinde Tablo Yeniden Render

- **Sorun**: Hissedar silindiğinde `fetchShareholders()` tüm veriyi yeniden çekiyordu ve tablo tamamen yeniden render ediliyordu.
- **Çözüm**: `useDeleteShareholder` içinde `removeShareholder(shareholderId)` kullanılıyor; sadece ilgili hissedar store'dan kaldırılıyor.
- **Dosya**: `hooks/useShareholders.ts`
- **Not**: `empty_share` güncellemesi DB trigger (trg_shareholder_delete) ile yapılıyor; sacrifice_animals realtime ile güncelleniyor.

---

## 4. last_edited_by / change_owner – Email ve Değişiklik Kayıtları

### Admin tarafında last_edited_by artık email

- **Admin bölümünden** yapılan düzenlemelerde `last_edited_by` artık kullanıcı adı yerine **email** saklanıyor.
- **Dosyalar**:
  - `app/(admin)/kurban-admin/hissedarlar/ayrintilar/[id]/page.tsx` – hissedar güncelleme
  - `app/(admin)/kurban-admin/kurbanliklar/ayrintilar/[id]/page.tsx` – kurbanlık güncelleme
  - `app/(admin)/kurban-admin/kurbanliklar/tum-kurbanliklar/components/new-sacrifice-animal.tsx` – yeni kurbanlık

### Değişiklik Kayıtları – Düzenleyen filtresi

- **change_owner** DB'de email olarak saklanıyor.
- **API**: `get-change-logs` route'u `users` tablosundaki `email` ile eşleştirip `name` döndürüyor.
- **Düzenleyen filtresi**: Sadece users tablosunda kayıtlı kullanıcıların isimleri gösteriliyor; diğerleri "-" olarak gösteriliyor.
- **Dosya**: `app/api/get-change-logs/route.ts`

---

## 5. Değişiklik Kayıtları – Veri ve Yenileme Davranışı

- **Store**: Değişiklik kayıtları store'a alınmıyor; gereksiz veri çekilmiyor.
- **Yenileme**: `window.addEventListener("focus")` kaldırıldı; sekme değişince otomatik yenileme yok.
- **Veri**: Sayfa ilk açıldığında veya yıl değiştiğinde çekiliyor.
- **Dosya**: `hooks/useChangeLogs.ts`

---

## 6. Badge Renkleri (Admin Menü)

- **Golbaşı (mavi site)**: `bg-sac-blue`
- **Kahramankazan (yeşil site)**: `bg-sac-graph-green-tone-light`
- **Diğer tenant'lar**: `bg-sac-blue` (sarı/turuncu yerine mavi)
- **Dosya**: `app/(admin)/kurban-admin/components/layout/app-sidebar.tsx`

---

## 7. Özet Tablo

| Dosya | Değişiklik |
|-------|------------|
| `kurbanliklar/tum-kurbanliklar/components/columns.tsx` | Ödeme oranı kareleri, popup renkleri |
| `hissedarlar/tum-hissedarlar/components/columns.tsx` | Popup renkleri |
| `hooks/useShareholders.ts` | Delete: `removeShareholder` kullanımı |
| `hooks/useChangeLogs.ts` | Focus listener kaldırıldı |
| `app/api/get-change-logs/route.ts` | change_owner: email→name eşleştirme |
| `app-sidebar.tsx` | Badge renkleri |
| `hissedarlar/ayrintilar/[id]/page.tsx` | last_edited_by: email |
| `kurbanliklar/ayrintilar/[id]/page.tsx` | last_edited_by: email |
| `new-sacrifice-animal.tsx` | last_edited_by: email |

---

## 8. Admin Sayfa Başlıkları, Breadcrumb ve Açıklamalar (2025-03-16)

### Menü adı = sayfa başlığı
- **Kurbanlıklar**: "Tüm Kurbanlıklar" → "Kurbanlıklar"
- **Hissedarlar**: "Tüm Hissedarlar" → "Hissedarlar"
- Menüdeki ad ile sayfa başlığı artık aynı.

### Breadcrumb düzeltmeleri (client-layout turkishCorrections)
- `tum-kurbanliklar` → "Kurbanlıklar"
- `tum-hissedarlar` → "Hissedarlar"
- `uyumsuz-hisseler` → "Uyumsuzluklar"
- `odemeler` → "Ödemeler"

### Açıklamalar sadeleştirildi
- Tüm admin sayfa açıklamaları kısaltıldı, öz bilgi korundu.
- Örnek: Genel Bakış → "Kurban satış ve dağıtım sürecinin özet bilgileri."

### Açıklama genişliği
- Başlık/açıklama wrapper: `w-full`
- Açıklama paragrafı: `max-w-[50%]` — sayfa genişliğinin en fazla yarısını kaplar.

### Etkilenen sayfalar
- genel-bakis, kurbanliklar/tum-kurbanliklar, hissedarlar/tum-hissedarlar, hissedarlar/odemeler
- degisiklik-kayitlari, uyumsuz-hisseler, rezervasyonlar, iletisim-mesajlari
- reminder-talepleri, kullanici-yonetimi

### Dosyalar
- `app/(admin)/kurban-admin/client-layout.tsx`
- `app/(admin)/kurban-admin/**/page.tsx` (yukarıdaki sayfalar)
