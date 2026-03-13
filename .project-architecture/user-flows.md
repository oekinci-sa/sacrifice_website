# Sistem Akışları

Bu dosya projedeki tüm kullanıcı ve sistem akışlarını dokümante eder. **Akış değişikliği yapıldığında bu dosya güncellenmelidir.**

---

## 1. Kimlik Doğrulama (Auth)

### 1.1 Google ile Giriş (OAuth)

| Adım | Aktör | Aksiyon | Sonuç |
|------|-------|---------|-------|
| 1 | Kullanıcı | /giris → "Google ile Giriş" | Google OAuth başlatılır |
| 2 | NextAuth | signIn callback | users tablosunda email kontrolü |
| 3a | Sistem | Kullanıcı yok | users INSERT (status: pending), user_tenants INSERT (approved_at: null), redirect "/" |
| 3b | Sistem | Kullanıcı var, bu tenant'ta user_tenants yok | user_tenants INSERT (approved_at: null), redirect "/" veya TenantAccessDenied |
| 3c | Sistem | Kullanıcı var, user_tenants.approved_at null | redirect "/giris?error=TenantPendingApproval" (engellenir) |
| 3d | Sistem | Kullanıcı var, approved | Giriş başarılı |
| 4 | Sistem | users.status = blacklisted | Giriş reddedilir |

### 1.2 Credentials ile Giriş

| Adım | Aksiyon |
|------|---------|
| 1 | Email + şifre ile authorize (users tablosu) |
| 2 | blacklisted ise red |
| 3 | Başarılı ise JWT, session |

---

## 2. Kullanıcı Yönetimi (Admin)

### 2.1 Kullanıcı Listesi

| Adım | Aksiyon |
|------|---------|
| 1 | GET /api/users → user_tenants (tenant_id) ile filtre |
| 2 | Sadece bu tenant'ta user_tenants kaydı olan kullanıcılar listelenir |

### 2.2 Kullanıcı Onaylama

| Adım | Aksiyon |
|------|---------|
| 1 | Admin "Onayla" → PATCH /api/users/[id]/status { status: "approved" } |
| 2 | users.status güncellenir, user_tenants.approved_at set edilir |
| 3 | "Onayla ve diğer siteye de ekle" → mevcut + diğer tenant için approved_at set |

### 2.3 Yeni Kullanıcı Ekleme

| Adım | Aksiyon |
|------|---------|
| 1 | Admin "Yeni Kullanıcı" → POST /api/users |
| 2 | users INSERT, user_tenants INSERT (mevcut tenant) |

---

## 3. Hisse Alma (Public)

### 3.1 Rezervasyon Oluşturma

| Adım | Aksiyon |
|------|---------|
| 1 | /hisseal → Hisse Seçimi: "Hisse Al" → share_count seç |
| 2 | POST /api/create-reservation → reservation_transactions INSERT (status: active) |
| 3 | DB trigger: empty_share azalır (sınır aşımı → failed_reservation_transactions_logs) |
| 4 | Client: Hisse Onayı sekmesine geç |

### 3.2 Hissedar Bilgileri ve Onay

| Adım | Aksiyon |
|------|---------|
| 1 | Accordion'larda ad, telefon vb. girilir |
| 2 | "Yeni Hissedar Ekle" → empty_share kontrolü, accordion artar |
| 3 | "Onayla" → POST /api/create-shareholders |
| 4 | shareholders INSERT, DB trigger: empty_share güncelleme |
| 5 | Redirect /hissesorgula |

### 3.3 Timeout / Sayfa Terk

| Adım | Aksiyon |
|------|---------|
| 1 | Beacon API → /api/timeout-reservation veya /api/cancel-reservation |
| 2 | reservation_transactions status güncelleme |
| 3 | DB trigger: empty_share artar |

---

## 4. Hisse Sorgulama (Public)

| Adım | Aksiyon |
|------|---------|
| 1 | /hissesorgula → telefon + 6 haneli güvenlik kodu |
| 2 | GET /api/get-shareholder-by-phone-and-code |
| 3 | Hissedar bilgileri, ödeme durumu, PDF indirme |

---

## 5. Admin – Kurbanlık Yönetimi

| Akış | API / Aksiyon |
|------|---------------|
| Kurbanlık listesi | GET /api/sacrifices (getSacrificeAnimals) |
| Kurbanlık ekleme | POST /api/create-sacrifice |
| Kurbanlık güncelleme | PATCH /api/update-sacrifice, update-sacrifice-share, update-sacrifice-timing |
| Kurbanlık silme | DELETE /api/sacrifices/[id] |
| Hissedar ekleme | POST /api/create-shareholders |
| Hissedar güncelleme | PATCH /api/update-shareholder |
| Hissedar silme | POST /api/delete-shareholder |

---

## 6. Admin – Genel Bakış / Metrikler

| Akış | Veri Kaynağı |
|------|--------------|
| Genel Bakış | useSacrificeStore, useShareholderStore |
| Satış grafikleri | shareholders.purchase_time |
| Rezervasyonlar | GET /api/get-reservation-transactions |
| Aşama metrikleri | GET /api/get-stage-metrics |
| Değişiklik kayıtları | GET /api/get-change-logs |

---

## 7. Tema / Tenant Ayarları

| Adım | Aksiyon |
|------|---------|
| 1 | Sayfa yüklenir → globals.css :root (nötr varsayılan) |
| 2 | ThemeProvider → GET /api/tenant-settings |
| 3 | theme_json → document.documentElement.style.setProperty ile override |

---

## 8. Bana Haber Ver (Takip)

| Adım | Aksiyon |
|------|---------|
| 1 | /takip → ad, telefon |
| 2 | POST /api/reminder-requests |
| 3 | GET /api/reminder-requests/check (tekrar kayıt kontrolü) |
