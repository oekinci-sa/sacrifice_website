# RLS (Row Level Security) ve Realtime

Bu doküman Supabase tablolarındaki RLS durumunu ve Realtime kullanımını özetler.

---

## RLS Durumu

Tüm tablolarda RLS **aktif**tir.

| Tablo | RLS | Policy | Açıklama |
|-------|-----|--------|----------|
| change_logs | ✓ | - | Policy yok → anon/authenticated erişemez |
| contact_messages | ✓ | - | Policy yok → anon/authenticated erişemez |
| failed_reservation_transactions_logs | ✓ | - | Policy yok → anon/authenticated erişemez |
| failed_trigger_logs | ✓ | - | Policy yok → anon/authenticated erişemez |
| mismatched_share_acknowledgments | ✓ | - | Policy yok → anon/authenticated erişemez |
| reminder_requests | ✓ | - | Policy yok → anon/authenticated erişemez |
| reservation_transactions | ✓ | Allow Realtime for all | SELECT için anon erişimi (Realtime) |
| sacrifice_animals | ✓ | Allow Realtime for all | SELECT için anon erişimi (Realtime) |
| shareholders | ✓ | Allow Realtime for all | SELECT için anon erişimi (Realtime) |
| stage_metrics | ✓ | Allow Realtime for all | SELECT için anon erişimi (Realtime) |
| tenant_domains | ✓ | - | Policy yok → anon/authenticated erişemez |
| tenant_settings | ✓ | - | Policy yok → anon/authenticated erişemez |
| tenants | ✓ | - | Policy yok → anon/authenticated erişemez |
| user_tenants | ✓ | - | Policy yok → anon/authenticated erişemez |
| users | ✓ | - | Policy yok → anon/authenticated erişemez |

---

## Mimari Notları

- **API route'ları** `supabaseAdmin` (service_role) kullanır → RLS **bypass** edilir.
- **Client tarafı** `supabase` (anon key) kullanır → sadece Realtime subscription için.
- Policy olmayan tablolarda anon/authenticated tüm satırlara erişemez.
- "Allow Realtime for all" policy'si sadece **SELECT** için; INSERT/UPDATE/DELETE policy yok → anon bu işlemleri yapamaz.

---

## Realtime Kullanımı

**Realtime açık tablolar** (supabase_realtime publication): Sadece uygulamanın subscribe ettiği tablolar.

| Tablo | Kullanım |
|-------|----------|
| reservation_transactions | Rezervasyonlar badge, tablo; hisseal sayfası timeout/status |
| shareholders | useShareholderStore |
| sacrifice_animals | share-select-dialog, sacrifice store |
| stage_metrics | Takip sayfası, useStageMetricsStore |

**Realtime kapalı:** change_logs, failed_reservation_transactions_logs, users (ve diğer tüm tablolar)

**Tüm tablolarda Realtime açmanın etkisi:**
- Gereksiz DB NOTIFY, Realtime sunucu yükü ve maliyet artışı
- Sadece Realtime kullanılan tablolarda açık tutulmalı

---

## View'lar (UNRESTRICTED)

Supabase'de `mismatched_shares` UNRESTRICTED; kendi RLS policy'si yok, alttaki tabloların RLS'i geçerli.

---

## Migration

- RLS etkinleştirme: `db/migrations/enable_rls_on_all_tables.sql`
- Realtime kapatma: `db/migrations/disable_realtime_on_unused_tables.sql`
