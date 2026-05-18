# Otomatik SMS varsayılan şablonları

Production’da tenant başına beş `event_key` için örnek şablonlar Supabase migration’ları ile eklendi:

| Supabase migration | event_key |
|--------------------|-----------|
| `sms_templates_seed_slaughter_approaching` | `slaughter_approaching` |
| `sms_templates_seed_slaughter_completed` | `slaughter_completed` |
| `sms_templates_seed_butcher_started` | `butcher_started` |
| `sms_templates_seed_delivery_pickup_approaching` | `delivery_pickup_approaching` |
| `sms_templates_seed_external_delivery_notice` | `external_delivery_notice` |

Yeni ortamda şablon metinleri admin panelinden (**SMS Şablonları**) oluşturulabilir; seed SQL bu repoda tutulmaz (tenant ve metin içeriği ortama göre değişir).

İlgili şema: `event_key` kolonu → `migrations/sms_templates_add_event_key_2026_05_18.sql`.
