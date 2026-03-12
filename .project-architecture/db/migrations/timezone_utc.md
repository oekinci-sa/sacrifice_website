# Migration: timezone_utc

Tüm timestamp alanları UTC (TIMESTAMPTZ) olarak saklanır.

- **Önceki:** `TIMESTAMP` + `now() AT TIME ZONE 'Europe/Istanbul'`
- **Sonra:** `TIMESTAMPTZ` + `now()` (UTC)

Etkilenen tablolar: sacrifice_animals, shareholders, reservation_transactions, change_logs, users, failed_reservation_transactions_logs.

Frontend'de gösterim: `lib/date-utils.ts` ile Türkiye saati (Europe/Istanbul).
