# `log_sacrifice_changes` — parça dosyalar

Tek kaynak: `fragments/` altındaki sıralı SQL parçaları.

- Birleştirilmiş dosya (Supabase’e yapıştırılacak tam script): üst dizindeki `../log_sacrifice_changes.sql`
- Üretim: repo kökünden `npm run db:merge:log-sacrifice-changes`

Parça sırası `scripts/merge-log-sacrifice-changes.mjs` içinde tanımlıdır; yeni parça eklerken script’e de ekleyin.

**Düzenleme:** `log_sacrifice_changes.sql` dosyasını elle değiştirmeyin; parçaları düzenleyip birleştirme komutunu çalıştırın.
