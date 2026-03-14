# Hisseal Rezervasyon Timer Sabitleri

Tüm timer sabitleri `lib/constants/reservation-timer.ts` dosyasında tanımlıdır.
Client (useReservationAndWarningManager) ve API (create-reservation) bu dosyayı kullanır —
`TIMEOUT_DURATION` değiştiğinde hem session timer hem DB `expires_at` aynı değere göre çalışır.

## lib/constants/reservation-timer.ts

| Sabit | Production | Açıklama |
|-------|------------|----------|
| `TIMEOUT_DURATION` | 900 (15 dk) | Oturum süresi — session timer + DB expires_at |
| `INACTIVITY_TIMEOUT` | 180 (3 dk) | Hareketsizlik süresi — mouse/klavye yoksa redirect + timed_out |
| `INACTIVITY_WARNING_THRESHOLD` | 60 (1 dk) | Inactivity uyarı banner eşiği (kalan sn) |
| `THREE_MINUTE_WARNING` | 180 (3 dk) | "3 dk kaldı" uyarısı eşiği |
| `ONE_MINUTE_WARNING` | 60 (1 dk) | "1 dk kaldı" uyarısı eşiği |

## DB (reservation_transactions tablosu)

| Alan | Default |
|------|---------|
| `expires_at` | `now() + interval '15 minutes'` |

Tablo tanımı: `.project-architecture/db/tables/reservation_transactions/table.sql`
