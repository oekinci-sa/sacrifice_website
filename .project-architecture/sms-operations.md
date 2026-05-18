# SMS İşlemleri

Admin panelinde SMS gönderim modülü — Bizim SMS API entegrasyonu.

**UI, `sms_enabled`, Tüm Hissedarlar SMS sütunu / PDF sırası, hissedar zaman çizelgesi:** [sms-admin-and-tenant-flag.md](./sms-admin-and-tenant-flag.md)

## Genel Bilgi

- **Sağlayıcı:** [Bizim SMS](https://api.sms.bizimsms.mobi)
- **API Belgeler:** `.sms-api-docs/bizim-sms/`
- **Faz durumu:** Faz 1 ve Faz 2 tamamlandı. Bizim SMS iletim raporu (DLR) uygulama ve veritabanında takip edilmez.
- **Gerçek gönderim kimliği:** `lib/sms-config.ts` → `getSmsCredentials(tenantId)` şu an yalnızca **`KAHRAMANKAZAN_TENANT_ID`** için Bizim SMS kullanıcı/şifre/originator döndürür; diğer tenant’larda `null` olur ve `POST …/sms/send` 503 ile düşer (env eksik olduğunda da aynı).
- **Modül görünürlüğü (sidebar + hissedar SMS sütunu):** `tenant_settings.sms_enabled`. Düzenleme: süper admin, Organizasyon Ayarları (`PATCH /api/admin/tenant-settings/[tenantId]` ile `sms_enabled`). Detay: [sms-admin-and-tenant-flag.md](./sms-admin-and-tenant-flag.md).

## Ortam Değişkenleri

```
BIZIM_SMS_USERNAME=imhankara
ANKARA_KURBAN_BIZIM_SMS_API_SECRET=<api_secret>   # Bizim SMS API şifre
BIZIM_SMS_ORIGINATOR=IMH ANKARA
BIZIM_SMS_API_BASE=https://api.sms.bizimsms.mobi  # opsiyonel, varsayılan bu
```

## Veritabanı Tabloları

| Tablo | Açıklama |
|---|---|
| `tenant_settings.sms_enabled` | Bu tenant için admin’de SMS menüsü ve Tüm Hissedarlar SMS sütununun görünürlüğü (`BOOLEAN DEFAULT FALSE`; DDL bkz. `db/tables/tenant_settings/table.sql`). |
| `sms_templates` | Yeniden kullanılabilir SMS şablonları (kategori, değişken listesi); `DELETE` route soft delete |
| `sms_sends` | Her gönderim grubu (tekil/toplu, durum, sayılar, idempotency) |
| `sms_send_recipients` | Her gönderimin bireysel alıcıları (`personalized_message`, `status`, `skip_reason`) |
| `sms_notification_events` | Otomatik SMS idempotency (tenant + yıl + hissedar + `event_key`) |
| `tenant_settings.sms_auto_enabled` | Kurban günü otomatik gönderim bayrağı (`sms_enabled`’dan ayrı) |
| `tenant_settings.sms_slaughter_approach_offset` | «Kesim yaklaşıyor» kaç kurban öncesi (default 20) |
| `tenant_settings.sms_delivery_pickup_offset` | «Teslim çağrısı» kaç kurban öncesi (default 2) |

Tüm tablolar: `supabaseAdmin` (service role) üzerinden erişilir, RLS aktif.

**Migration kaynakları (`.project-architecture/db/tables/`):**

| Konu | Migration dosyası |
|------|-------------------|
| `sms_enabled` | `tenant_settings/migrations/add_sms_enabled_to_tenant_settings_2026_05_13.sql` |
| Otomatik SMS bayrak + offset | `tenant_settings/migrations/tenant_settings_add_sms_auto_columns_2026_05_18.sql` |
| `sms_templates` + `event_key` | `sms_templates/migrations/create_sms_templates_2026_05_06.sql`, `sms_templates_add_event_key_2026_05_18.sql` |
| `sms_notification_events` | `sms_notification_events/migrations/create_sms_notification_events_2026_05_18.sql` |
| `stage_metrics` yıl filtresi | `stage_metrics/migrations/fix_stage_metrics_trigger_year_filter_2026_05_18.sql` |

## Kütüphaneler (`lib/`)

| Dosya | İşlev |
|---|---|
| `lib/sms-client.ts` | Bizim SMS API wrapper (sendSms, queryCredit, queryOriginators) |
| `lib/sms-character-counter.ts` | TR/EN karakter sayma ve SMS boy hesaplama |
| `lib/sms-config.ts` | Tenant bazlı Bizim SMS kimlik bilgisi çözümleme |
| `lib/sms-phone-normalizer.ts` | Ham telefon → 12 hane Bizim SMS formatı (`normalizePhone`, `isValidPhone`) |
| `lib/sms-dedup.ts` | Mükerrer alıcı anahtarı: normalize cep + kurban bağlamı; **isim yok** |
| `lib/sms-send-title-display.ts` | Hissedar zaman çizelgesinde otomatik başlıktaki tekrar tarih kalıplarını kısaltır |
| `lib/sms-auto-sender.ts` | Kurban günü otomatik SMS — `handleAutoSms`, şablon + idempotency + Bizim SMS gönderimi |
| `lib/sms-template-variables.ts` | Şablon değişkenleri (`buildSmsVariablesFromShareholderRow`) |

## API Routes — Faz 1

| Route | Method | Açıklama |
|---|---|---|
| `/api/admin/sms/templates` | GET, POST | Şablon listesi (`active=true` varsayılan; pasifler için `inactive=true`) ve oluşturma |
| `/api/admin/sms/templates/[id]` | PUT, DELETE | Şablon güncelleme ve soft delete |
| `/api/admin/sms/recipients` | GET | SMS alıcı listesi (yıl/kurban bazlı); `deliveryFilter=all\|slaughterhouse\|other` ile teslimat tercihi süzme |
| `/api/admin/sms/send` | POST | SMS gönderimi (validasyon + kredi + dedup + API) |
| `/api/admin/sms/sends` | GET | Gönderim geçmişi |
| `/api/admin/sms/sends/[id]` | GET | Gönderim detayı (per-recipient) |

## API Routes — Faz 2

| Route | Method | Açıklama |
|---|---|---|
| `/api/admin/sms/credit` | GET | Canlı kredi bakiyesi (super_admin) |
| `/api/admin/sms/originators` | GET | Onaylı SMS başlıkları (super_admin) |
| `/api/admin/sms/stats` | GET | Operatör kabul / başarısız özeti ve aylık dağılım (telefon ulaşım DLR saklanmaz) |
| `/api/admin/sms/sends/[id]/cancel` | POST | Taslak gönderim iptali (admin/super_admin) |
| `/api/admin/sms/sends/[id]/retry` | POST | Başarısız alıcıları yeni kayıtla yeniden dene |
| `/api/admin/sms/shareholder-history` | GET | Hissedar bazlı son 50 gönderim alıcı satırı; yanıtta `personalized_message` |

## `POST /api/admin/sms/send` İş Akışı

1. Auth + rol (toplu: admin/super_admin; tekil: tüm roller)
2. Zod validasyon
3. `idempotency_key` **zorunlu** — çift gönderim 409 döner
4. Kredi kontrolü: hard block — `allowCreditCheckFailure: true` ile bypass
5. Telefon normalize → geçersizler `skipped`
6. Dedup (varsayılan: açık) → `skipped`
7. Değişken çözümleme → boş değişken `warnings` listesinde döner (gönderimi bloklamaz)
8. Bizim SMS API çağrısı (1-N veya N-N XML)
9. Sonuçlar DB'ye yazılır

**Test SMS:** `target_params.is_test: true` işaretlenerek gönderilir. İstatistiklerde `excludeTest=true` ile hariç tutulabilir.

### Başarılı yanıtta dışlanma kırılımı

Başarılı veya bazı hata cevaplarında (örn. bazı gönderilerde gönderilecek kalmadan 400):

- `excluded`: toplam dışlanan alıcı
- `excluded_invalid_phone`: geçersiz telefon nedeniyle
- `excluded_duplicate_phone`: dedup nedeniyle (aynı kurbanlıkta aynı normalize cep ile ikinci kayıt; **isim dikkate alınmaz**)

İstemci (SMS Gönder sayfası) toast’ta bu alanları Türkçe açıklar.

## Tenant ayarları ve organizasyon yüzeyi

- `sms_enabled`: [sms-admin-and-tenant-flag.md](./sms-admin-and-tenant-flag.md) ve `tenant_settings` DDL.
- Super admin güncelleme: `PATCH /api/admin/tenant-settings/[tenantId]` gövdesinde `{ "sms_enabled": true|false }`.

## Retry Akışı (Faz 2)

`POST /api/admin/sms/sends/[id]/retry` yeni bir `sms_sends` kaydı açar:

```json
{
  "title": "[Tekrar Deneme] <orijinal başlık>",
  "target_type": "custom",
  "target_params": {
    "retry_of": "<orijinal_send_id>",
    "retry_reason": "failed_recipients"
  }
}
```

- Eski gönderim kaydı değişmez; orijinal hata korunur
- Yeni denemenin kendi takibi ayrıdır
- Retry öncesi kredi kontrolü tekrar yapılır

## İptal Akışı (Faz 2)

`POST /api/admin/sms/sends/[id]/cancel` yalnızca `status = 'draft'` için çalışır.
`completed`, `partial_fail`, `failed` durumlarında 400 döner. UI'da bu durumlar için buton gösterilmez.

## SMS Durum Etiketleri

**Gönderim (sms_sends.status):**

| DB | UI |
|---|---|
| `completed` | Operatöre gönderildi |
| `partial_fail` | Kısmen gönderildi |
| `failed` | Başarısız |
| `draft` | Taslak |
| `cancelled` | İptal edildi |

**Alıcı (sms_send_recipients.status):**

| DB | UI |
|---|---|
| `sent` | Operatöre iletildi |
| `failed` | Gönderilemedi |
| `skipped` | Atlandı |

## Şablon Değişkenleri

```
{{ad_soyad}}  {{telefon}}  {{hayvan_no}}  {{kurban_no}}  {{kupe_no}}  {{hisse_no}}
{{kesim_saati}}  {{kesim_tarihi}}
{{kalan_tutar}}  {{odenen_tutar}}  {{toplam_tutar}}  {{kapora_tutari}}
{{teslimat_tercihi}}  {{teslimat_adresi}}  {{sorgulama_linki}}
{{guvenlik_kodu}}  {{iban}}
```

Boş kalan değişkenler gönderimi bloklamaz; mesajda `{{variable_name}}` olarak kalır ve `warnings` döner.

## Karakter Sayma

- Türkçe 2-slot: ğ Ğ ş Ş ı İ ç  
- Türkçe 1-slot: ü Ü ö Ö Ç  
- TR: 1 boy = 155, 2 boy = 292, ... 6 boy = 882 karakter  
- EN: 1 boy = 160, 2 boy = 306, ... 6 boy = 917 karakter  
- API max 6 boy üzerini keser

## Telefon Normalize Kuralları

Hedef: `905xxxxxxxxx` (12 hane)

| Girdi | Çıktı |
|---|---|
| `05551234567` | `905551234567` |
| `5551234567` | `905551234567` |
| `+905551234567` | `905551234567` |
| Geçersiz uzunluk | `null` (atlanır) |

## Yetkilendirme

| Aksiyon | editor | admin | super_admin |
|---|---|---|---|
| Tekil SMS gönderme | ✓ | ✓ | ✓ |
| Toplu SMS gönderme | — | ✓ | ✓ |
| Şablon CRUD | oluştur/düzenle | + sil | ✓ |
| Gönderim geçmişi | ✓ | ✓ | ✓ |
| Gönderim iptali (draft) | — | ✓ | ✓ |
| Retry (başarısız) | — | ✓ | ✓ |
| SMS Ayarları (kredi/originator/test) | — | — | ✓ |

## Tenant genişletme (yeni marka veya kurum)

Eski yaklaşım (`app-sidebar.tsx` ile sabit UUID listesi) kaldırılmıştır. Yapılması gerekenler:

1. **DB:** İlgili `tenant_settings` satırında `sms_enabled = true` (Organizasyon Ayarları ile veya SQL).
2. **Kimlik:** `lib/sms-config.ts` içinde ilgili `tenant_id` için Bizim SMS `username` / şifre / originator döndürün; gerekiyorsa ortam değişkeni adları ekleyin (`getSmsCredentials`).

Yalnızca (1) yapılıp (2) yapılmazsa menü açılabilir ancak gönderim **SMS API yapılandırması eksik** ile 503 verir.

## Kurban günü otomatik SMS (uygulandı)

**Bayraklar (ikisi de gerekli):**

| Alan | Nerede açılır |
|------|----------------|
| `sms_enabled` | Organizasyon Ayarları — **SMS** sütunu |
| `sms_auto_enabled` | Organizasyon Ayarları — **Oto. SMS** sütunu |

**Tetikleyici:** Takip ekranlarında aşama tamamlanınca `POST /api/update-sacrifice-timing` (`stage`: `slaughter_stage` \| `butcher_stage` \| `delivery_stage`, `is_completed: true`) → RPC başarılıysa `handleAutoSms({ tenantId, sacrificeYear, sacrificeNo, stage, isCompleted })` (hata route’u bloklamaz).

**Sayfalar:** `/kesimsirasi`, `/parcalamasirasi`, `/teslimatsirasi` — `StageQueuePage` → `QueueCardWithButtons`.

### `sms_templates.event_key`

| `event_key` | Ne zaman | Hedef hissedar |
|-------------|----------|----------------|
| `slaughter_approaching` | Kesim aşaması tamamlandı | `sacrifice_no + sms_slaughter_approach_offset`, yalnız **Kesimhane** |
| `slaughter_completed` | Kesim aşaması tamamlandı | Aynı kurban, tümü |
| `butcher_started` | Parçalama tamamlandı | Aynı kurban, **Kesimhane** |
| `delivery_pickup_approaching` | Teslimat tamamlandı | `sacrifice_no + sms_delivery_pickup_offset`, **Kesimhane** |
| `external_delivery_notice` | Teslimat tamamlandı | Aynı kurban, Kesimhane **dışı** |

`event_key` NULL → yalnızca manuel gönderimde kullanılan şablon. Tenant başına aktif şablonda aynı `event_key` en fazla bir kez (`uq_sms_templates_tenant_event_key`).

### Idempotency ve kayıt

1. Gönderim öncesi `sms_notification_events` ile hissedar + `event_key` kontrolü.
2. `sms_sends` + `idempotency_key`: `auto:{event_key}:{tenant_id}:{sacrifice_id}:{year}`.
3. Sonrasında `sms_notification_events` upsert (tekrar gönderim engeli).

DDL: [db/tables/sms_notification_events/table.sql](./db/tables/sms_notification_events/table.sql).

### Admin — şablon yönetimi

- Sayfa: `/kurban-admin/sms-islemleri/sablonlari`
- Düzenleme diyalogu: `event_key` Select — manuel = `none` (boş string Radix’te yasak); otomatik seçenekler gruplu.
- Liste filtresi: toolbar **Otomatik SMS** popover — çoklu `event_key` seçimi ile aktif şablonları süzme.

### Gelecek (henüz yok)

- `sms_auto_rules` tablosu / kural motoru
- Zamanlanmış SMS cron (`scheduled_at` vb.)
