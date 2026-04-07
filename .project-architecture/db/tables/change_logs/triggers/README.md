# `change_logs` audit tetikleyicileri — tek kaynak

`change_logs` tablosuna satır yazan fonksiyon ve `CREATE TRIGGER` tanımları **yalnızca tetiklendikleri tablonun** altında tutulur:

| Tetiklenen tablo | Kaynak dosya |
|------------------|--------------|
| `shareholders` | `../shareholders/functions_and_triggers/log_shareholder_changes.sql` |
| `sacrifice_animals` | Birleştirilmiş: `../sacrifice_animals/functions_and_triggers/log_sacrifice_changes.sql` — düzenleme parçaları: `log_sacrifice_changes/fragments/`, sonra `npm run db:merge:log-sacrifice-changes` |
| `users` | `../users/functions_and_triggers/log_user_changes.sql` |
| `user_tenants` | `../user_tenants/functions_and_triggers/log_user_tenants_changes.sql` |
| `mismatched_share_acknowledgments` | `../mismatched_share_acknowledgments/functions_and_triggers/log_mismatch_changes.sql` |
| `stage_metrics` | `../stage_metrics/functions_and_triggers/log_stage_metrics_changes.sql` |

Bu klasörde **`log_*.sql` dosyası tutulmaz** (yinelenen kopyalar kaldırıldı). Migration veya dokümantasyon güncellemelerinde yukarıdaki yolları kullanın.

---

## Dikkat: `chk_change_type` constraint uyumu

`change_logs.change_type` sütununda **CHECK constraint** (`chk_change_type`) bulunur ve yalnızca `'INSERT'`, `'UPDATE'`, `'DELETE'` değerlerini kabul eder. (Bkz: `migrations/change_logs_change_type_en_mismatch_row_id_uuid_2026_04_02.sql`)

**Yaşanan sorun (2026-04-07):** `log_user_changes()` trigger'ının INSERT dalı eski Türkçe `'Ekleme'` değerini gönderiyordu; migration ile constraint İngilizce'ye geçirilmişti ama trigger fonksiyonu güncellenmemişti. Sonuç: `users` INSERT → trigger → `change_logs` INSERT → constraint violation → **tüm transaction rollback** → kullanıcı kaydı oluşmuyor, OAuth `AccessDenied` hatası.

**Ders:** `change_type` constraint değiştirildiğinde **tüm** trigger fonksiyonlarındaki `change_type` değerleri de güncellenmeli. Yukarıdaki tablodaki her dosya kontrol edilmeli.
