# SMS İşlemleri

Admin panelinde SMS gönderim modülü — Bizim SMS API entegrasyonu.

## Genel Bilgi

- **Başlangıç tenantı:** Yalnızca `ankarakurban` (`KAHRAMANKAZAN_TENANT_ID`)
- **Sağlayıcı:** [Bizim SMS](https://api.sms.bizimsms.mobi)
- **API Belgeler:** `.sms-api-docs/bizim-sms/`
- **Faz durumu:** Faz 1 tamamlandı, Faz 2 tamamlandı

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
| `sms_templates` | Yeniden kullanılabilir SMS şablonları (kategori, değişken listesi) |
| `sms_sends` | Her gönderim grubu (tekil/toplu, durum, sayılar, idempotency) |
| `sms_send_recipients` | Her gönderimin bireysel alıcıları |
| `sms_auto_rules` | **Faz 3'te eklenecek** |

Tüm tablolar: `supabaseAdmin` (service role) üzerinden erişilir, RLS aktif.

## Kütüphaneler (`lib/`)

| Dosya | İşlev |
|---|---|
| `lib/sms-client.ts` | Bizim SMS API wrapper (sendSms, queryCredit, queryOriginators, queryDlr) |
| `lib/sms-character-counter.ts` | TR/EN karakter sayma ve SMS boy hesaplama |
| `lib/sms-config.ts` | Tenant bazlı kimlik bilgisi çözümleme |
| `lib/sms-phone-normalizer.ts` | Ham telefon → 12 hane Bizim SMS formatı |

## API Routes — Faz 1

| Route | Method | Açıklama |
|---|---|---|
| `/api/admin/sms/templates` | GET, POST | Şablon listesi ve oluşturma |
| `/api/admin/sms/templates/[id]` | PUT, DELETE | Şablon güncelleme ve soft delete |
| `/api/admin/sms/recipients` | GET | SMS alıcı listesi (yıl/kurban bazlı) |
| `/api/admin/sms/send` | POST | SMS gönderimi (validasyon + kredi + dedup + API) |
| `/api/admin/sms/sends` | GET | Gönderim geçmişi |
| `/api/admin/sms/sends/[id]` | GET | Gönderim detayı (per-recipient) |

## API Routes — Faz 2

| Route | Method | Açıklama |
|---|---|---|
| `/api/admin/sms/credit` | GET | Canlı kredi bakiyesi (super_admin) |
| `/api/admin/sms/originators` | GET | Onaylı SMS başlıkları (super_admin) |
| `/api/admin/sms/stats` | GET | İstatistikler |
| `/api/admin/sms/sends/[id]/cancel` | POST | Taslak gönderim iptali (admin/super_admin) |
| `/api/admin/sms/sends/[id]/retry` | POST | Başarısız alıcıları yeni kayıtla yeniden dene |
| `/api/admin/sms/shareholder-history` | GET | Hissedar bazlı SMS geçmişi |

## `POST /api/admin/sms/send` İş Akışı

1. Auth + rol (toplu: admin/super_admin; tekil: tüm roller)
2. Zod validasyon
3. `idempotency_key` **zorunlu** — çift gönderim 409 döner
4. Alıcı limiti: max 200
5. Kredi kontrolü: hard block — `allowCreditCheckFailure: true` ile bypass
6. Telefon normalize → geçersizler `skipped`
7. Dedup (varsayılan: açık) → `skipped`
8. Değişken çözümleme → boş değişken `warnings` listesinde döner (gönderimi bloklamaz)
9. Bizim SMS API çağrısı (1-N veya N-N XML)
10. Sonuçlar DB'ye yazılır

**Test SMS:** `target_params.is_test: true` işaretlenerek gönderilir. İstatistiklerde `excludeTest=true` ile hariç tutulabilir.

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
{{ad_soyad}}  {{telefon}}  {{hayvan_no}}  {{kurban_no}}  {{hisse_no}}
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

## Tenant Genişletme

SMS modülü başlangıçta `KAHRAMANKAZAN_TENANT_ID` ile kısıtlı.  
Elya için aktifleştirmek: `app-sidebar.tsx` → `sms-operations` → `allowedTenantIds` dizisine `GOLBASI_TENANT_ID` ekle. `lib/sms-config.ts`'e Elya kimlik bilgilerini ekle.

## Faz 3 — Otomasyon (Gelecek)

- `sms_auto_rules` tablosu
- Zamanlanmış SMS (`scheduled_at` alanı DB'de hazır)
- Cron: scheduled-send, auto-rules
