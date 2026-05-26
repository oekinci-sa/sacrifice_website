# Operatör sıra ekranları, PIN koruması, planlı teslim offset, SMS UX (2026-05)

## Özet

Bu changelog dört ana iş paketini kapsar:

1. **Operatör sıra sayfaları** (`/kesimsirasi`, `/parcalamasirasi`, `/teslimatsirasi`) — 6 haneli PIN koruması, kurban no ile git, hissedar araması, kurbanlık hissedar tablosu.
2. **Güvenlik Ayarları** — Admin panelinden tenant başına sayfa PIN’leri.
3. **SMS UX ve şablon değişkenleri** — Editör etiketleri, şablon seçici filtresi, alıcı listesi kaydet uyarısı, sütun seçici scroll.
4. **Planlı teslim saati offset’i** — `tenant_settings.planned_delivery_offset_minutes`; sabit 90 dk kaldırıldı.

---

## 1. Operatör sıra sayfaları — PIN, arama, navigasyon

### Sayfalar

| Route | `page_key` | Açıklama |
|-------|------------|----------|
| `/kesimsirasi` | `slaughter` | Kesim sırası |
| `/parcalamasirasi` | `butcher` | Parçalama sırası |
| `/teslimatsirasi` | `delivery` | Teslimat sırası |

Her sayfa `StageQueuePage` → `QueueAccessGate` → `QueueCardWithButtons` + `ShareholderSearchBar` + `SacrificeShareholdersCard` ile sarılır.

### PIN koruması (6 haneli admin şifresi)

- SMS OTP değil; admin **Güvenlik Ayarları**’ndan tenant + sayfa bazında belirlenir.
- PIN düz metin saklanmaz: HMAC-SHA256 (`QUEUE_ACCESS_SECRET` + kod) → `queue_page_access_codes.code_hash`.
- Doğrulama sonrası imzalı JWT cookie: `qa_token_{pageKey}` (httpOnly, 8 saat).
- PIN henüz set edilmemişse sayfa **açık** (gate geçilir); admin PIN atayınca koruma devreye girer.

### Rate limit

| Parametre | Değer |
|-----------|-------|
| Anahtar | `tenant_id` + `page_key` + `ip_hash` |
| Max hatalı deneme | 5 |
| Kilitleme | 10 dakika |
| Tablo | `queue_page_access_attempts` |

IP hash: `HMAC-SHA256(QUEUE_ACCESS_SECRET + ":ip", client_ip)`.

### API

| Route | Açıklama |
|-------|----------|
| `POST /api/queue-access/verify` | PIN doğrula; cookie set; rate limit |
| `GET /api/queue-access/check?pageKey=` | Cookie geçerli mi |
| `GET /api/queue-access/shareholder-search?pageKey=&q=` | PIN cookie sonrası ad/telefon arama; kurban no sıralı |

### UI özellikleri

- **Kurbanlık no ile git:** Numaratör altında doğrudan kurban no girişi.
- **Hissedar araması:** Admin hissedar aramasına benzer; ad soyad / cep / telefon; sonuçlar kurban no’ya göre sıralı; seçince ilgili kurban no’ya gider.
- **Hissedar tablosu:** Switch altında seçili kurbanlığın hissedarları (1. 2. 3. …); **light tema** zorunlu (`SacrificeShareholdersCard`).
- **Veri:** `GET /api/get-shareholders-by-sacrifice-no?sacrificeNo=` (sayfa erişimi cookie ile korunur).

### Ortam değişkeni

```
QUEUE_ACCESS_SECRET=<rastgele-güçlü-secret>
```

---

## 2. Güvenlik Ayarları (admin)

| Alan | Değer |
|------|-------|
| Sayfa | `/kurban-admin/guvenlik-ayarlari` |
| Menü | Kullanıcı Yönetimi üstünde; `ShieldCheck` ikon |
| Roller | **admin**, **super_admin** (editor erişemez) |
| API | `GET/PUT /api/admin/security/queue-codes` |

Her tenant için üç kart: Kesim / Parçalama / Teslimat. PIN 6 rakam; PUT ile upsert (`queue_page_access_codes`).

---

## 3. SMS UX ve şablon değişkenleri

### SMS Gönder — mesaj editörü etiketleri

Kaldırıldı (UI butonları): `{{iban}}`, `{{sorgulama_linki}}`.

Eklendi: `{{teslimat_saati}}` — `sacrifice_animals.planned_delivery_time` (HH:MM); kesim saati değil.

Kaynak: `lib/sms-template-variables.ts` → `buildSmsVariablesFromShareholderRow`.

**Not:** Eski şablon gövdesinde yanlışlıkla `{{kesim_saati}}` kullanan kayıtlar veri düzeltmesi gerektirir (ör. «Hissedar Tam Bilgilendirme»).

### SMS Gönder — şablondan seç

Dropdown yalnızca **manuel** şablonları listeler (`event_key` NULL); otomatik kurban günü şablonları gösterilmez.

### SMS Gönder — alıcı listesi

Alıcı tikleri kaldırılıp «Listeyi kaydet» basılmadan çıkılırsa kaydet butonu **kırmızı** (dikkat); kayıttan sonra normale döner.

### Admin tablo — Sütunlar popover

Uzun sütun listesinde dikey scroll (`column-selector-popover.tsx`).

### Elyahayvancılık Bizim SMS

`lib/sms-config.ts` + env: `ELYAHAYVANCILIK_BIZIM_SMS_*` (username, api secret, originator).

### Kurban Günü İstatistikleri — Hisse Bilgisi

Kurbanlıklar tablosunda «Hisse Bilgisi» sütunu: `kg · TL` formatı; NaN düzeltmesi (`animal-columns.tsx`).

### SMS hissedar arama (admin)

`GET /api/admin/sms/shareholder-search` sıralama düzeltmesi: `order("sacrifice_no", { referencedTable: "sacrifice_animals", ascending: true })`.

---

## 4. Planlı teslim saati offset (tenant ayarı)

### Sorun

`planned_delivery_time` kesim saatinden sabit **+90 dk** ile türetiliyordu (trigger + `rpc_update_sacrifice_core`). Elyahayvancılık gibi tenant’lar için 120 dk gibi farklı offset gerekebilir.

### Çözüm

| Katman | Değişiklik |
|--------|------------|
| `tenant_settings` | `planned_delivery_offset_minutes SMALLINT NOT NULL DEFAULT 90` — **CHECK yok** (sınır admin sorumluluğunda) |
| INSERT trigger | `set_planned_delivery_time_on_insert()` → tenant offset okur |
| `rpc_update_sacrifice_core` | `sacrifice_time` patch’inde offset tenant’tan |
| Toplu güncelleme | `bulk_update_planned_delivery_time(tenant_id, sacrifice_year, offset_minutes)` |
| Admin API | `PATCH /api/admin/tenant-settings/[tenantId]` — offset değişince aktif yılın tüm `sacrifice_animals` satırları yeniden hesaplanır |
| Admin UI | Organizasyon Ayarları düzenleme diyalogu — «Planlı teslim saati — kesim saatinden kaç dakika sonra?» |

Yalnızca ilgili tenant + **aktif kurban yılı** güncellenir; geçmiş yıllar ve diğer tenant’lar etkilenmez.

### DB dosyaları (repo)

```
.project-architecture/db/tables/tenant_settings/table.sql
.project-architecture/db/tables/tenant_settings/migrations/planned_delivery_offset_minutes_2026_05_25.sql
.project-architecture/db/tables/sacrifice_animals/functions_and_triggers/set_planned_delivery_time_on_insert.sql
.project-architecture/db/tables/sacrifice_animals/functions_and_triggers/bulk_update_planned_delivery_time.sql
.project-architecture/db/tables/sacrifice_animals/functions_and_triggers/rpc_update_sacrifice_core.sql
.project-architecture/db/tables/queue_page_access_codes/table.sql
.project-architecture/db/tables/queue_page_access_attempts/table.sql
```

---

## İlgili uygulama dosyaları (özet)

```
lib/queue-access-hash.ts
lib/sms-template-variables.ts
app/(takip)/components/queue-access-gate.tsx
app/(takip)/components/shareholder-search-bar.tsx
app/(takip)/components/sacrifice-shareholders-card.tsx
app/(takip)/components/stage-queue-page.tsx
app/(takip)/components/queue-card-with-buttons.tsx
app/api/queue-access/*
app/api/admin/security/queue-codes/route.ts
app/api/get-shareholders-by-sacrifice-no/route.ts
app/(admin)/kurban-admin/guvenlik-ayarlari/page.tsx
app/api/admin/tenant-settings/[tenantId]/route.ts
app/(admin)/kurban-admin/tenant-ayarlari/components/tenant-settings-edit-dialog.tsx
```

## Dokümantasyon güncellemeleri

- [features.md](../features.md) — Operatör sıra, güvenlik, offset
- [user-flows.md](../user-flows.md) — PIN akışı
- [role-permissions.md](../role-permissions.md) — Güvenlik Ayarları
- [controls.md](../controls.md) — Sıra ekranı kontrol listesi
- [sms-operations.md](../sms-operations.md) — `{{teslimat_saati}}`, editör etiketleri
- [pages/admin-pages.md](../pages/admin-pages.md), [pages/public-pages.md](../pages/public-pages.md)
