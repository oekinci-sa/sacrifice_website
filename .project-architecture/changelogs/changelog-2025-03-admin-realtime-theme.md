# Changelog – Admin Realtime, Tema ve UI İyileştirmeleri (2025-03)

Bu doküman 2025 Mart ayında yapılan admin paneli, realtime ve tema değişikliklerini özetler.

---

## 1. Rezervasyonlar – Gerçek Realtime Güncelleme

### Sorun
Rezervasyonlar badge ve tablosu 15 saniyede bir polling ile güncelleniyordu. Hisse alma işlemi başladığında sayfa yenilenmeden anlık güncelleme yoktu.

### Çözüm
- **Supabase Realtime** ile `reservation_transactions` tablosuna abone olundu.
- INSERT, UPDATE, DELETE olaylarında badge ve tablo anında güncellenir.
- Polling kaldırıldı.

### Dosyalar
| Dosya | Değişiklik |
|-------|------------|
| `hooks/useActiveReservationsCount.ts` | Supabase `postgres_changes` subscription; polling kaldırıldı |
| `app/(admin)/kurban-admin/rezervasyonlar/page.tsx` | Realtime subscription; polling kaldırıldı |

### Event
- `reservation-updated` custom event: `useCreateReservation` başarılı rezervasyon sonrası tetiklenir (aynı tarayıcıda anında güncelleme için).

---

## 2. Uyumsuzluklar – Aktif Rezervasyon Filtreleme

### Sorun
Bir hayvanda hisse alma işlemi başladığında, hissedar henüz `shareholders` tablosuna düşmediği için o hayvan uyumsuzluk olarak görünüyordu.

### Çözüm
- `reservation_transactions` tablosundan `status = 'active'` olan `sacrifice_id` listesi alınır.
- Bu hayvanlar uyumsuzluklar sonuçlarından çıkarılır.
- Aktif rezervasyonu olan kurbanlık uyumsuzluklar tablosunda gösterilmez.

### Dosya
- `app/api/admin/mismatched-shares/route.ts`

### Ek
- `editor` rolü uyumsuzluklar API'sine yetkili roller listesine eklendi.

---

## 3. Admin Panel – Nötr Tema ve Tenant Accent

### Sorun
Admin panelinde sidebar ve genel UI tenant renkleri (yeşil/mavi) kullanıyordu. Kullanıcı nötr bir admin teması istedi; ancak badge ve CTA butonları tenant renginde kalmalıydı.

### Çözüm

#### 3.1 Admin Nötr Tema (`.admin-neutral-theme`)
- `app/(admin)/kurban-admin/client-layout.tsx` ana div'ine `admin-neutral-theme` sınıfı verildi.
- `globals.css` içinde `.admin-neutral-theme` ile `--primary`, `--sac-primary`, `--sidebar-*` vb. nötr gri tonlara override edildi.
- Sidebar, nav linkleri, genel UI nötr görünür.

#### 3.2 Tenant Accent (`.admin-tenant-accent`)
- Badge ve CTA butonları tenant renginde kalmalı.
- `ThemeStyles` tenant teması enjekte ederken `--tenant-primary`, `--sac-tenant-primary` vb. değişkenleri de set eder.
- `.admin-neutral-theme .admin-tenant-accent` bu değişkenleri geri yükleyerek ilgili elementlere tenant rengi uygular.

#### 3.3 Uygulama Yerleri
| Bileşen | Sınıf |
|---------|-------|
| Sidebar badge'leri | `admin-tenant-accent` |
| Yeni Kurbanlık butonu | `admin-tenant-accent` |
| Kaydet butonu (Yeni Kurbanlık dialog) | `admin-tenant-accent` |
| Filtre sayı badge'leri (Kurbanlıklar, Hissedarlar, Ödemeler, Teslimatlar, Değişiklik Kayıtları) | `admin-tenant-accent` |

### Dosyalar
| Dosya | Değişiklik |
|-------|------------|
| `app/globals.css` | `.admin-neutral-theme`, `.admin-tenant-accent`, `--tenant-*` fallback |
| `components/theme/ThemeStyles.tsx` | `--tenant-primary`, `--sac-tenant-primary` vb. enjeksiyon |
| `app/(admin)/kurban-admin/components/layout/app-sidebar.tsx` | Badge `admin-tenant-accent` |
| `app/(admin)/kurban-admin/kurbanliklar/.../new-sacrifice-animal.tsx` | Butonlar `admin-tenant-accent` |
| `sacrifice-filters.tsx`, `shareholder-filters.tsx`, `payment-filters.tsx`, `teslimat-filters.tsx`, `change-log-filters.tsx` | FilterCountBadge `admin-tenant-accent` |

---

## 4. Kurbanlıklar – Ödeme Durumu Popup İyileştirmeleri

### Sorun
- Ödeme durumu popup tek sütunlu ve uzundu.
- Çubuklar (1-2-3-4) ile popup'taki isimler arasında net eşleşme yoktu.
- Hissedarı olmayan hayvanlarda popup gereksiz açılıyordu.

### Çözüm
- **2 sütun**: Popup `grid grid-cols-2` ile iki sütunlu yapıldı.
- **1-2-3-4 etiketleri**: Her hissedar adının önüne sıra numarası eklendi (örn. `1. Ahmet Yılmaz`).
- **Boş hissedar**: `shareholders.length === 0` ise tooltip/popup açılmaz; sadece çubuklar gösterilir.

### Dosya
- `app/(admin)/kurban-admin/kurbanliklar/tum-kurbanliklar/components/columns.tsx` — `ShareholderBarsCell`

---

## 5. Özet Tablo

| Alan | Değişiklik |
|------|------------|
| Rezervasyonlar | Supabase Realtime; anlık badge ve tablo güncellemesi |
| Uyumsuzluklar | Aktif rezervasyonu olan hayvan listeden çıkarılır |
| Admin tema | Nötr UI; badge ve CTA butonları tenant renginde |
| Ödeme durumu popup | 2 sütun, 1-2-3-4 etiketleri, boş hissedar yoksa popup yok |
