# Changelog — SMS şablon değişkenleri, ödeme otomatik SMS, filtre UX (2026-05)

## Özet

SMS şablon değişkenleri standardize edildi; ödeme tutarı güncellemesi şablona bağlandı; şablon listesi üçlü filtre ile yenilendi; hissedar silinince SMS kayıtları CASCADE; production şablon metinlerinde eski değişken adları güncellendi.

## Şablon değişken standardizasyonu

| Konu | Detay |
|------|--------|
| Birincil kurban no | `{{kurban_no}}` — `{{hayvan_no}}` kaldırıldı (kod + DB şablon metinleri) |
| Eski tahmini süre | `{{tahmini_dakika}}` → aşamaya göre `{{kesim_tahmini_sure}}`, `{{parcalama_tahmini_sure}}`, `{{teslimat_tahmini_sure}}` |
| Ham ortalama | `{{kesim_ortalama_suresi}}`, `{{parcalama_ortalama_suresi}}`, `{{teslimat_ortalama_suresi}}` (dakika, `stage_metrics`) |
| Tetikleyici kurban | `{{kesilen_kurban_no}}` — yalnız kurban günü otomatik şablonları |
| Tahmini süre hesabı | `buildSmsVariablesFromShareholderRow` içinde: ortalama × tenant offset (expression parser yok) |

**Kod:** `lib/sms-template-variables.ts`, `lib/sms-auto-sender.ts` (`AutoSmsContext` ham avg + offset).

**Editör:** `sms-editor.tsx` — otomatik değişken butonları yalnızca sıra sayfası `event_key` seçiliyken (`showAutoVariables`); ödeme / manuel şablonda gizli.

## Ödeme tutarı otomatik SMS

| Alan | Değer |
|------|--------|
| `event_key` | `payment_amount_updated` |
| Tetikleyici | `POST /api/update-shareholder` — `paid_amount` patch sonrası |
| Bayrak | `sms_enabled` ( **`sms_auto_enabled` gerekmez** ) |
| Motor | `lib/sms-payment-notification.ts` → `sendPaymentAmountUpdatedSms` |
| Şablon | Tenant başına aktif `payment_amount_updated` şablonu; admin düzenleyebilir |
| Seed | Production’da tenant başına varsayılan metin eklendi (Supabase `execute_sql`) |

Ödemeler sayfasındaki sabit metin + istemci tarafı `/api/admin/sms/send` kaldırıldı; gönderim sunucuda.

## SMS Şablonları — liste filtresi

Toolbar: **Şablonları filtrele** (tek popover, çoklu seçim):

| Seçenek | Gösterilen kayıtlar |
|---------|---------------------|
| Sizin yazdıklarınız | Aktif, `event_key` NULL (manuel) |
| Otomatik SMS'ler | Aktif, `event_key` dolu |
| Pasif SMS'ler | `is_active = false` (manuel + otomatik) |

**Varsayılan:** üç seçenek de işaretli. Pasif liste ilk yüklemede de çekilir (`inactive=true`).

Ayrı «Pasif şablonları göster» ve «Otomatik SMS» butonları kaldırıldı.

**Sayfa:** `app/(admin)/kurban-admin/sms-islemleri/sablonlari/page.tsx`

## Event key merkezi liste

`lib/sms-event-keys.ts` — `SMS_AUTO_EVENT_KEYS`, etiketler, API Zod enum ile paylaşımlı.

## Hissedar silme — SMS FK CASCADE

Hissedar silinirken `23503` (`sms_send_recipients`) hatası giderildi:

| Tablo | FK davranışı |
|-------|----------------|
| `sms_send_recipients` | `ON DELETE CASCADE` |
| `sms_notification_events` | `ON DELETE CASCADE` |
| `sms_blocklist` | `ON DELETE CASCADE` |

Migration: `db/tables/*/migrations/*_shareholder_on_delete_cascade_2026_05_19.sql` (Supabase: `sms_shareholder_fk_on_delete_cascade`).

## İlgili dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `lib/sms-event-keys.ts` | Yeni — event anahtarları + etiketler |
| `lib/sms-payment-notification.ts` | Yeni — ödeme SMS gönderimi |
| `lib/sms-template-variables.ts` | Değişken map + `AutoSmsContext` |
| `lib/sms-auto-sender.ts` | Context geçişleri |
| `app/api/update-shareholder/route.ts` | Ödeme SMS tetikleme |
| `app/api/admin/sms/templates/route.ts` | `payment_amount_updated` enum |
| `app/(admin)/.../editable-paid-amount-cell.tsx` | İstemci SMS kaldırıldı |
| `app/(admin)/.../sablonlari/page.tsx` | Üçlü filtre UI |

## Dokümantasyon

- `sms-operations.md` — değişken listesi, ödeme event, admin filtre
- `pages/admin-pages.md` — Şablonları / Ödemeler
- `user-flows.md` — ödeme SMS akışı
- `features.md` — özet + changelog linki
