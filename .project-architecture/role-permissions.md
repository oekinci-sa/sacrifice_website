# Rol Yetkileri

Bu dokümanda admin panelindeki roller ve her rolün neleri yapabileceği tanımlanmıştır.

## Roller

| Rol | Açıklama |
|-----|----------|
| **super_admin** | Super Yönetici – Tüm yetkilere sahip, tüm tenantlara erişebilir |
| **admin** | Yönetici – Kendi tenant'ında kullanıcı yönetimi ve onay işlemleri |
| **editor** | Editör – Kullanıcı yönetimi hariç admin paneli erişimi |
| **null** (Belirlenmedi) | Henüz rol atanmamış |

---

## Menü Erişimi (Sidebar)

| Menü | editor | admin | super_admin |
|------|:------:|:-----:|:-----------:|
| Genel Bakış | ✓ | ✓ | ✓ |
| Kurbanlıklar | ✓ | ✓ | ✓ |
| Hissedarlar | ✓ | ✓ | ✓ |
| Değişiklik Kayıtları | ✓ | ✓ | ✓ |
| Uyumsuzluklar | ✓ | ✓ | ✓ |
| **Rezervasyonlar** | ✗ | ✗ | ✓ |
| İletişim Mesajları | ✓ | ✓ | ✓ |
| Bana Haber Ver Talepleri | ✓ | ✓ | ✓ |
| Mail İşlemleri | ✓ | ✓ | ✓ |
| **Kullanıcı Yönetimi** | ✗ | ✓ | ✓ |

---

## Route Bazlı Erişim (Middleware)

| Route | editor | admin | super_admin |
|-------|:------:|:-----:|:-----------:|
| `/kurban-admin/*` (genel) | ✓ | ✓ | ✓ |
| `/kurban-admin/kullanici-yonetimi` | ✗ | ✓ | ✓ |
| `/kurban-admin/rezervasyonlar` | ✗ | ✗ | ✓ |

- **editor** kullanıcı yönetimine girmeye çalışırsa → `/kurban-admin/genel-bakis`'e yönlendirilir
- **admin** rezervasyonlara girmeye çalışırsa → `/kurban-admin/genel-bakis`'e yönlendirilir

---

## API Yetkileri

### Kullanıcı Yönetimi

| İşlem | editor | admin | super_admin |
|-------|:------:|:-----:|:-----------:|
| Kullanıcı listesi (GET /api/users) | ✓ | ✓ | ✓ |
| Kullanıcı oluşturma (POST /api/users) | ✗ | ✓ | ✓ |
| Kullanıcı güncelleme (PUT /api/users/[id]) | kendisi | ✓ | ✓ |
| Kullanıcı silme (DELETE /api/users/[id]) | ✗ | ✓ | ✓ |
| Rol güncelleme | ✗ | ✓* | ✓ |
| **super_admin rolü atama** | ✗ | ✗ | ✓ |
| Profil fotoğrafı yükleme | kendisi | ✓ | ✓ |

\* admin: admin, editor, belirlenmedi atayabilir; **super_admin atayamaz**

### Durum (Status) İşlemleri

| İşlem | editor | admin | super_admin |
|-------|:------:|:-----:|:-----------:|
| Onayla | ✗ | ✓ | ✓ |
| Onayı Kaldır | ✗ | ✓ | ✓ |
| Engelle / Engeli Kaldır | ✗ | ✓ | ✓ |
| **Onayla ve diğer siteye de ekle** | ✗ | ✗ | ✓ |

### Diğer API'ler

| API | editor | admin | super_admin |
|-----|:------:|:-----:|:-----------:|
| Kurbanlık silme (DELETE /api/sacrifices/[id]) | ✗ | ✓ | ✓ |
| Rezervasyon işlemleri (GET /api/get-reservation-transactions) | ✗ | ✗ | ✓ |
| Uyumsuz hisseler (mismatched-shares) | ✓ | ✓ | ✓ |
| Toplu e-posta (POST /api/admin/send-email), alıcı listesi (GET /api/admin/email-recipients) | ✓ | ✓ | ✓ |
| Aşama metrikleri güncelleme (POST /api/update-stage-metrics) | ✓ | ✓ | ✓ |

---

## super_admin Özel Yetkileri

1. **Tüm tenantlara erişim**: Yeni bir tenant'a ilk girişte otomatik onaylı eklenir; onay beklemez
2. **Rezervasyonlar sayfası**: Sadece super_admin erişebilir
3. **super_admin rolü atama**: Sadece super_admin başka kullanıcıya super_admin verebilir
4. **Onayla ve diğer siteye de ekle**: Kullanıcıyı mevcut tenant + diğer tenant'a aynı anda onaylı ekler

---

## Rol Değişiklik Kuralları

- **super_admin** rolündeki kullanıcının rolü tablodan değiştirilemez (güvenlik)
- super_admin rolü atama seçeneği sadece super_admin kullanıcılarında görünür (UI)
- admin rolündeki kullanıcı başka birine super_admin atayamaz (API 403)

---

## İlgili Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `middleware.ts` | Route bazlı erişim kontrolü |
| `app-sidebar.tsx` | Menü görünürlüğü (roles) |
| `lib/auth.ts` | super_admin tenant erişimi, blacklist |
| `app/api/users/[id]/status/route.ts` | addToOtherTenant super_admin check |
| `app/api/users/[id]/route.ts` | Rol güncelleme, super_admin atama |
| `app/api/users/route.ts` | Yeni kullanıcı, super_admin atama |
| `app/api/update-stage-metrics/route.ts` | `rpc_update_stage_metrics`; editor+ ve oturum e-postası |
| `app/api/create-sacrifice/route.ts` | editor+; `last_edited_by` oturum e-postası |
| `app/api/create-shareholders/route.ts` | Açık (hisseal); audit için `last_edited_by` sunucuda (oturum veya `hisseal-akisi`) |
| `app/api/sacrifices/[id]/route.ts` | `rpc_delete_sacrifice`; admin/super_admin; oturum e-postası zorunlu |
| `status-cell.tsx` | "Onayla ve diğer siteye de ekle" sadece super_admin |
| `role-cell.tsx` | super_admin seçeneği sadece super_admin'de |
