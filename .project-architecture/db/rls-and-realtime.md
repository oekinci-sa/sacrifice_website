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

## Güvenlik Analizi — `USING (true)` Policy Riski

`USING (true)` policy'si olan tablolar (`reservation_transactions`, `sacrifice_animals`, `shareholders`, `stage_metrics`) anon anahtarıyla PostgREST üzerinden doğrudan okunabilir.

**Kabul edilen risk gerekçesi:**
- Tüm yazma işlemleri service_role üzerinden; anon INSERT/UPDATE/DELETE yapamaz.
- `sacrifice_animals` ve `stage_metrics` zaten herkese açık veriler (fiyat, boş hisse, aşama bilgisi).
- `reservation_transactions.transaction_id` 16 karakterlik rastgele ID; brute-force ile ulaşılması pratikte mümkün değil.
- `shareholders` hassas personal data içeriyor — aşağıda iyileştirme önerileri var.

**Riskleri azaltan faktörler:**
- Middleware `x-tenant-id` header'ını host üzerinden set ediyor; client body'den tenant_id alınmıyor.
- `supabaseAdmin` service_role tüm API route'larında kullanılıyor.

**Uzun vadeli iyileştirme önerileri (bu dosyadaki migration/plan kapsamı dışında):**

1. `shareholders` Realtime'ını kaldır, admin sayfasını polling'e geçir → anon SELECT policy'yi kaldır.
2. Supabase Realtime filtered publication ile sadece gerekli sütunları yayınla.
3. `reservation_transactions` için sadece kendi transaction_id'sini dinleyen client-side filter kullanmaya devam et (zaten yapılıyor).

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

## Client: çok kiracılı Realtime ve Zustand (kritik)

**Sorun:** `sacrifice_animals` (ve benzeri) için anon Realtime aboneliği, RLS’te `USING (true)` olduğu ve istemcide `supabase.realtime.setAuth(anon)` kullanıldığı için **tüm tenant’lardaki** INSERT/UPDATE/DELETE olaylarını iletebilir. REST API ise `tenant_id` ile filtrelenmiş veri döner.

**Sonuç:** Örn. admin **Kurbanlıklar** listesinde başka tenant’a ait bir satır, store’da `updateSacrifice` ile listenin sonuna **eklenebiliyordu** (satır ID listede yoksa append).

**Zorunlu koruma (uygulama tarafı):**
- `stores/global/useSacrificeStore.ts`: Realtime payload işlenmeden önce **`tenant_id`** ve mümkünse **`sacrifice_year`** (son başarılı `refetchSacrifices` kapsamı + host’tan tenant) ile **filtrele**; uymayan olayları yok say.
- İleride iyileştirme: Supabase kanalında `filter: 'tenant_id=eq.<uuid>'` (RealtimeManager / abonelik parametresi) ile sunucu tarafında gürültüyü azaltmak.

**Tekrar oluşmaması için:** Yeni Realtime + global store birleşimlerinde aynı tenant/yıl doğrulamasını ekle veya aboneliği filtreli kur.

---

## View'lar (UNRESTRICTED)

Supabase'de `mismatched_shares` UNRESTRICTED; kendi RLS policy'si yok, alttaki tabloların RLS'i geçerli.

---

## Migration

- RLS etkinleştirme: `db/migrations/enable_rls_on_all_tables.sql`
- Realtime kapatma: `db/migrations/disable_realtime_on_unused_tables.sql`
