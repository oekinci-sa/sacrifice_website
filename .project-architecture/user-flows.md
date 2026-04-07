# Sistem Akışları

Bu dosya projedeki tüm kullanıcı ve sistem akışlarını dokümante eder. **Akış değişikliği yapıldığında bu dosya güncellenmelidir.**

---

## 1. Kimlik Doğrulama (Auth)

### 1.1 Google ile Giriş (OAuth)

| Adım | Aktör | Aksiyon | Sonuç |
|------|-------|---------|-------|
| 1 | Kullanıcı | /giris → "Google ile Giriş" | Google OAuth başlatılır |
| 2 | NextAuth | signIn callback | users tablosunda email kontrolü |
| 3a | Sistem | Kullanıcı yok | users INSERT (status: pending), user_tenants INSERT (approved_at: null), giriş izni verilir, middleware admin route'u engeller → "/" |
| 3b | Sistem | Kullanıcı var, bu tenant'ta user_tenants yok | user_tenants UPSERT (approved_at: null), giriş izni verilir, middleware admin route'u engeller → "/" |
| 3c | Sistem | Kullanıcı var, user_tenants.approved_at null | Giriş izni verilir, middleware admin route'u engeller → "/" (kullanıcı yönetimi sayfasından admin onaylar) |
| 3d | Sistem | Kullanıcı var, approved | Giriş başarılı, callbackUrl'e yönlendirilir |
| 4 | Sistem | users.status = blacklisted | Giriş reddedilir (signIn → false) |

### 1.2 Credentials ile Giriş

| Adım | Aksiyon |
|------|---------|
| 1 | Email + şifre ile authorize (users tablosu) |
| 2 | blacklisted ise red |
| 3 | signIn callback: Bu tenant için user_tenants yoksa INSERT (approved_at: null) |
| 4 | Başarılı ise JWT, session |

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

### 3.4 Heartbeat (Canlılık Sinyali)

| Adım | Aksiyon |
|------|---------|
| 1 | details / confirmation adımlarında istemci 15 sn'de bir POST /api/reservation/heartbeat atar |
| 2 | API: last_heartbeat_at = now() güncellenir (status aktif olmalı) |
| 3 | pg_cron (30s): expire_stale_reservations() — last_heartbeat_at 30 sn'den eski aktif rezervasyonları **offline** yapar |
| 4 | DB trigger: empty_share otomatik restore (mevcut trg_handle_reservation_deactivation) |
| 5 | Supabase Realtime: client status='offline' (veya expired/canceled/timed_out) alır → handleTimeoutRedirect (setTimeout(0) ile defer) |
| 6 | bfCache dönüşü: pageshow ile status kontrol → expired ise handleTimeoutRedirect |

### 3.5 Hakkımızda (Elya tenant)

| Adım | Aksiyon |
|------|---------|
| 1 | GET `/hakkimizda` → Elya ise `ElyaAboutLanding`: tam metin, görseller, **Bizden Kareler** (yatay video + yanında 3 Shorts; oklarla diğer Shorts), müşteri yorumları |
| 2 | Elya değilse mevcut metin + görsel + `AnimatedCounter` düzeni |

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
| Kurbanlık ekleme | POST /api/create-sacrifice (editor+; `last_edited_by` sunucuda oturum e-postası) |
| Kurbanlık güncelleme | PUT /api/update-sacrifice; POST /api/update-sacrifice-share, /api/update-sacrifice-timing |
| Kurbanlık silme | DELETE /api/sacrifices/[id] (`rpc_delete_sacrifice`, oturum e-postası = `app.actor`) |
| Hissedar ekleme | POST /api/create-shareholders (`last_edited_by` sunucuda: oturum e-postası veya `hisseal-akisi`; `purchased_by` müşteri) |
| Hissedar güncelleme | POST /api/update-shareholder (`rpc_update_shareholder`); **Hissedar Ayrıntıları**nda teslimat tercihi düzenlenmez (hisse alımındaki seçim korunur) |
| Hissedar kurban sırası (başka kurbanlığa taşıma) | POST /api/admin/shareholders/[id]/move-sacrifice (`target_sacrifice_no`; `rpc_move_shareholder_to_sacrifice`); **Tüm Hissedarlar** «Kur. Sır.» sütunu ve hissedar detayı |
| Hissedar silme | POST /api/delete-shareholder |

---

## 6. Admin – Genel Bakış / Metrikler

| Akış | Veri Kaynağı |
|------|--------------|
| Genel Bakış | useSacrificeStore, useShareholderStore |
| Satış grafikleri | shareholders.purchase_time |
| Rezervasyonlar | GET /api/get-reservation-transactions (kolonlar: `completed_at` işlem bitişi); tablo üstü filtreler: Kurban No, Hisse Sayısı, Durum; **Realtime**: Supabase `postgres_changes` (reservation_transactions) ile badge ve tablo anında güncellenir |
| Aşama metrikleri | GET /api/get-stage-metrics (takip + admin okuma); **POST /api/update-stage-metrics** — anlık kurban no (editor+; RPC + `change_logs` satırı) |
| Değişiklik kayıtları | GET /api/get-change-logs |
| Uyumsuz hisseler | GET /api/admin/mismatched-shares (aktif rezervasyonu olan sacrifice_id'ler çıkarılır), POST /api/admin/mismatched-shares/acknowledge; shareholders AFTER INSERT trigger farkındalığı sıfırlar |
| Mail (admin) | `/kurban-admin/mail-islemleri` → GET /api/admin/email-recipients?year=, POST /api/admin/send-email (Resend; editor+; alıcılar panel + seçili yıl hissedar allowlist) |
| Mail (otomatik) | Hisseal teşekkür sayfası → POST /api/purchase-confirmation-email { transaction_id } (hissedar e-postası varsa; bir kez / işlem) |

---

## 7. Tema / Tenant Ayarları

| Adım | Aksiyon |
|------|---------|
| 1 | Sayfa yüklenir → globals.css :root (nötr varsayılan) |
| 2 | ThemeStyles (Server Component) → tenant_settings.theme_json → :root inline style |
| 3 | Admin paneli: .admin-neutral-theme nötr override; .admin-tenant-accent badge/CTA için tenant rengi |

---

## 8. Bana Haber Ver (Takip)

| Adım | Aksiyon |
|------|---------|
| 1 | /takip → ad, telefon |
| 2 | POST /api/reminder-requests |
| 3 | GET /api/reminder-requests/check (tekrar kayıt kontrolü) |
