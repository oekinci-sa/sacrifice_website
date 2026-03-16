# Changelog – Kullanıcı Onayı, Badge ve Hisse Bedelleri (2025-03)

Bu doküman kullanıcı yönetimi, badge davranışı ve hisse bedelleri ile ilgili yapılan değişiklikleri özetler.

---

## 1. Kullanıcı Yönetimi – user_tenants Kaydı

### Sorun
- Admin panele yetkisiz giriş deneyen kullanıcı onay sayfasına yönlendiriliyordu (doğru).
- Ancak yetkili admin Kullanıcı Yönetimi listesinde bu kullanıcıyı göremiyordu.
- **Sebep**: Kullanıcı listesi `user_tenants` tablosuna bakıyor; OAuth callback'te `user_tenants` kaydı oluşturulmuyordu.

### Çözüm
- **auth.ts**: `existingUser` sorgusu `supabase` (anon) yerine `supabaseAdmin` kullanıyor (RLS engeli kaldırıldı).
- **auth.ts**: `getTenantIdForAuth()` eklendi – `x-tenant-id` yoksa `Host` header'ından tenant çözümlemesi.
- **Credentials login**: signIn callback'te `user_tenants` oluşturma/upsert eklendi (OAuth ile aynı davranış).
- **OAuth (Google)**: Tüm tenant çözümlemeleri `getTenantIdForAuth()` ile yapılıyor.

### Dosyalar
- `lib/auth.ts`
- `lib/tenant-resolver.ts` (import)
- `.project-architecture/user-flows.md` (Credentials akışı güncellendi)

---

## 2. Admin Sidebar – Badge Flash Önleme

### Sorun
- Kullanıcı yönetimi, iletişim mesajları, hissedarlar ve uyumsuzluk badge'leri sayfa ilk yüklenirken kısa süre görünüp kayboluyordu.

### Çözüm
- Tüm count hook'larına `isLoading` eklendi.
- Badge sadece `!isLoading && count > 0` iken gösteriliyor.
- Veri gelmeden badge gösterilmiyor.

### Dosyalar
- `hooks/usePendingUserCount.ts`
- `hooks/useUnreadContactMessagesCount.ts`
- `hooks/useUncontactedShareholdersCount.ts`
- `hooks/useUnacknowledgedMismatchesCount.ts`
- `app/(admin)/kurban-admin/components/layout/app-sidebar.tsx`

---

## 3. EmptySharesBadge – Header/Footer Flash Önleme

### Sorun
- Header ve footer'daki kırmızı "Son X Hisse" badge'i ilk yüklemede görünüp kayboluyordu.
- Anasayfa banner'daki aynı badge bu sorunu yaşamıyordu (banner viewport'a girdiğinde veri zaten yüklü oluyordu).

### Çözüm
- `EmptySharesBadge`: `isInitialized` kontrolü eklendi.
- Badge sadece `!isLoading && isInitialized` iken gösteriliyor.
- Store henüz populate edilmemişken badge render edilmiyor.

### Dosyalar
- `components/common/empty-shares-badge.tsx`

---

## 4. Hisse Bedelleri – Son Satır Ortalama

### Sorun
- "Bu Seneki Hisse Bedellerimiz" bölümünde 4-4-2 grid düzeninde son 2 öğe sola yaslanıyordu.

### Çözüm
- Orijinal grid yapısı korundu: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`.
- Son satırda 2 öğe kaldığında (`length % 4 === 2`) bu öğelere `md:col-start-2` ve `md:col-start-3` verilerek ortalama sağlandı.
- `justify-items-center` ile tüm öğeler hücre içinde ortalandı.

### Dosyalar
- `app/(public)/(anasayfa)/components/prices.tsx`

---

## 5. Bekleyen Kullanıcılar Badge

- Kullanıcı Yönetimi menüsünde onay bekleyen kullanıcı sayısı badge ile gösteriliyor.
- Mevcut sidebar mantığı ile entegre (`showPendingUserBadge`).

---

---

## 6. Kullanıcı Yönetimi – Tablo İyileştirmeleri

### "Onayla ve diğer siteye de ekle" sadece super_admin
- Bu seçenek artık sadece super_admin rolündeki kullanıcılar tarafından görülebilir ve kullanılabilir.
- API: `addToOtherTenant` parametresi super_admin dışında 403 döndürür.

### Durum sütunu – Tablodan direkt işlem
- Durum sütunu tıklanabilir dropdown: Onayla, Onayı Kaldır, Engelle, Engeli Kaldır.
- "Onayla ve diğer siteye de ekle" seçeneği dropdown içinde (sadece super_admin).
- Kullanıcı sayfasına girmeden onay/onay kaldırma yapılabilir.

### Rol sütunu – Tablodan direkt değiştirme
- Rol sütunu Select ile tablodan değiştirilebilir: Admin, Editör, Belirlenmedi.
- super_admin rolü tablodan değiştirilemez (güvenlik).

### Onayı kaldırma
- API: `revokeApproval: true` ile user_tenants.approved_at = null.
- Bu tenant için erişim iptal edilir.

### Dosyalar
- `app/api/users/[id]/status/route.ts` – addToOtherTenant super_admin check, revokeApproval
- `kullanici-yonetimi/components/status-cell.tsx` – Yeni (durum dropdown)
- `kullanici-yonetimi/components/role-cell.tsx` – Yeni (rol select)
- `kullanici-yonetimi/components/columns.tsx` – StatusCell, RoleCell kullanımı
- `kullanici-yonetimi/components/data-table-row-actions.tsx` – Status menü öğeleri kaldırıldı

---

## Özet Tablo

| Dosya | Değişiklik |
|-------|------------|
| `lib/auth.ts` | user_tenants oluşturma, getTenantIdForAuth, supabaseAdmin |
| `hooks/usePendingUserCount.ts` | isLoading |
| `hooks/useUnreadContactMessagesCount.ts` | isLoading |
| `hooks/useUncontactedShareholdersCount.ts` | isLoading |
| `hooks/useUnacknowledgedMismatchesCount.ts` | isLoading, useState(null) |
| `app-sidebar.tsx` | isLoading ile badge gösterim koşulu |
| `empty-shares-badge.tsx` | isInitialized kontrolü |
| `prices.tsx` | Son satır ortalama (col-start) |
| `user-flows.md` | Credentials akışı |
| `api/users/[id]/status/route.ts` | addToOtherTenant super_admin, revokeApproval |
| `status-cell.tsx` | Yeni – durum dropdown |
| `role-cell.tsx` | Yeni – rol select |
| `data-table-row-actions.tsx` | Status menü öğeleri kaldırıldı |
