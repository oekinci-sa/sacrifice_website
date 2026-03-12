# Kullanıcı Onay Davranışı

## Per-tenant onay

- **users** tablosunda her kişi için tek kayıt vardır (email bazlı).
- **users.status** (pending/approved/blacklisted) globaldir.
- **user_tenants.approved_at** her tenant için ayrı onay durumunu tutar:
  - `approved_at` set → Bu tenant'a erişebilir
  - `approved_at` null → Bu tenant için onay bekliyor (admin panelinde görünür)

## Akış

1. **Gölbaşı'nda onaylanan kullanıcı** Kahramankazan'a girmek istediğinde → `user_tenants` (kahramankazan, approved_at: null) oluşturulur, kullanıcı "Onay Bekliyor" alır, Kahramankazan admin panelinde görünür.
2. **Onayla** → Sadece mevcut tenant için `approved_at` set edilir.
3. **Onayla ve diğer siteye de ekle** → Mevcut tenant + diğer tenant için `approved_at` set edilir; kullanıcı diğer siteye ilk girişte onay istemeden erişir.
4. Genel onaylı olmayan kişiler diğer sistemdeki adminlerin önüne düşer (user_tenants'a pending eklenir).
