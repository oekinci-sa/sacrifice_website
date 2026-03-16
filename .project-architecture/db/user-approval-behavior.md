# Kullanıcı Onay Davranışı

## Per-tenant onay

- **users** tablosunda her kişi için tek kayıt vardır (email bazlı).
- **users.status** (pending/approved/blacklisted) globaldir.
- **user_tenants.approved_at** her tenant için ayrı onay durumunu tutar:
  - `approved_at` set → Bu tenant'a erişebilir
  - `approved_at` null → Bu tenant için onay bekliyor (admin panelinde görünür)

---

## Neden İki Ayrı Alan? (users.status vs user_tenants.approved_at)

İki alan **farklı sorulara** cevap verir:

| Alan | Soru | Kapsam |
|------|-----|--------|
| **users.status** | "Bu kişi hiç onaylanmış mı?" | Global (tüm sistem) |
| **user_tenants.approved_at** | "Bu organizasyona erişebilir mi?" | Tenant bazlı |

### Tasarım Mantığı

**users.status** = "Bu kullanıcı en az bir organizasyonda onaylanmış mı?"
- `approved` → Evet, en az bir yerde onaylanmış (vetting tamamlanmış)
- `pending` → Hayır, hiçbir yerde onaylanmamış (yeni / vetting bekliyor)

**user_tenants.approved_at** = "Bu organizasyon bu kişiye erişim veriyor mu?"
- Set → Bu tenant erişim veriyor
- Null → Bu tenant henüz onaylamadı

### Örnek Senaryo (Ahmet – ahmet@mail.com)

| Adım | Olay | users.status | user_tenants (Gölbaşı) | user_tenants (Kahramankazan) |
|------|------|---------------|------------------------|------------------------------|
| 1 | Gölbaşı'nda ilk giriş | pending | null | - |
| 2 | Gölbaşı admini onayladı | **approved** | set | - |
| 3 | Ahmet Kahramankazan'a girmek istiyor | **approved** (değişmez) | set | null |
| 4 | Kahramankazan admini onayladı | approved | set | set |

### Neden status "approved" Kalıyor? (Adım 3)

Ahmet Gölbaşı'nda onaylandığı için artık "bilinen/vetted" bir kullanıcı. Kahramankazan'da onay bekliyor olsa bile bu gerçek değişmez – Gölbaşı onu tanıdı ve onayladı. **users.status** bu global vetting durumunu tutar.

Eğer status Kahramankazan'da pending olduğunda "pending"e dönseydi, "bu kişi hiç onaylanmamış" anlamına gelirdi – ki bu yanlış olurdu.

### Özet

- **users.status**: Global güven seviyesi – "Bu kişi sistemde tanınıyor mu?"
- **user_tenants.approved_at**: Organizasyon bazlı erişim – "Bu org bu kişiye kapı açıyor mu?"

---

## Akış

1. **Gölbaşı'nda onaylanan kullanıcı** Kahramankazan'a girmek istediğinde → `user_tenants` (kahramankazan, approved_at: null) oluşturulur, kullanıcı "Onay Bekliyor" alır, Kahramankazan admin panelinde görünür.
2. **Onayla** → Sadece mevcut tenant için `approved_at` set edilir.
3. **Onayla ve diğer siteye de ekle** → Mevcut tenant + diğer tenant için `approved_at` set edilir; kullanıcı diğer siteye ilk girişte onay istemeden erişir.
4. Genel onaylı olmayan kişiler diğer sistemdeki adminlerin önüne düşer (user_tenants'a pending eklenir).
