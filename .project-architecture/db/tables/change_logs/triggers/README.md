# `change_logs` audit tetikleyicileri — tek kaynak

`change_logs` tablosuna satır yazan fonksiyon ve `CREATE TRIGGER` tanımları **yalnızca tetiklendikleri tablonun** altında tutulur:

| Tetiklenen tablo | Kaynak dosya |
|------------------|--------------|
| `shareholders` | `../shareholders/functions_and_triggers/log_shareholder_changes.sql` |
| `sacrifice_animals` | `../sacrifice_animals/functions_and_triggers/log_sacrifice_changes.sql` |
| `users` | `../users/functions_and_triggers/log_user_changes.sql` |
| `user_tenants` | `../user_tenants/functions_and_triggers/log_user_tenants_changes.sql` |
| `mismatched_share_acknowledgments` | `../mismatched_share_acknowledgments/functions_and_triggers/log_mismatch_changes.sql` |
| `stage_metrics` | `../stage_metrics/functions_and_triggers/log_stage_metrics_changes.sql` |

Bu klasörde **`log_*.sql` dosyası tutulmaz** (yinelenen kopyalar kaldırıldı). Migration veya dokümantasyon güncellemelerinde yukarıdaki yolları kullanın.
