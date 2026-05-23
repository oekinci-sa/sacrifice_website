# Otomatik SMS varsayılan şablonları

Production’da tenant başına kurban günü `event_key` şablonları Supabase migration’ları ile eklendi; **ödeme** şablonu 2026-05 oturumunda tenant başına seed edildi.

## Kurban günü (sıra sayfaları)

| Supabase migration | event_key |
|--------------------|-----------|
| `sms_templates_seed_slaughter_approaching` | `slaughter_approaching` |
| `sms_templates_seed_slaughter_completed` | `slaughter_completed` |
| `sms_templates_seed_butcher_started` | `butcher_started` |
| `sms_templates_seed_delivery_pickup_approaching` | `delivery_pickup_approaching` |
| `sms_templates_seed_external_delivery_notice` | `external_delivery_notice` |

## Ödeme

| Kaynak | event_key |
|--------|-----------|
| Supabase `execute_sql` (2026-05) | `payment_amount_updated` |

Varsayılan metin: ödeme kaydı güncellendi + `{{odenen_tutar}}` / `{{kalan_tutar}}`. Admin panelinden düzenlenir.

## Değişken adı güncellemesi (2026-05)

Production şablon metinlerinde:

- `{{hayvan_no}}` → `{{kurban_no}}`
- `{{tahmini_dakika}}` → aşamaya göre `{{kesim_tahmini_sure}}`, `{{parcalama_tahmini_sure}}`, `{{teslimat_tahmini_sure}}`

Yeni ortamda şablon metinleri admin panelinden (**SMS Şablonları**) oluşturulabilir; seed SQL bu repoda tutulmaz (tenant ve metin içeriği ortama göre değişir).

İlgili şema: `event_key` kolonu → `migrations/sms_templates_add_event_key_2026_05_18.sql`.

Changelog: [changelogs/changelog-2026-05-sms-templates-variables-payment-filter.md](../../changelogs/changelog-2026-05-sms-templates-variables-payment-filter.md).
