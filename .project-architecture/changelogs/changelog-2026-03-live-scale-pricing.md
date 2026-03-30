# Canlı baskül (live_scale) fiyatlama — 2026-03

## Özet

- **`sacrifice_animals`**: `pricing_mode` (`fixed` \| `live_scale`), `live_scale_total_kg`, `live_scale_total_price`; `share_price` canlı modda `NULL`; CHECK `sacrifice_animals_pricing_consistency`.
- **`rebalance_live_scale_shareholders`**: Toplam tutarı kuruş cinsinden hissedar sayısına böler, `total_amount` / `remaining_payment` günceller.
- **RPC’ler** (migration: `db/tables/sacrifice_animals/migrations/live_scale_pricing_2026_03_29.sql`): `rpc_insert_shareholders_batch`, `rpc_delete_shareholder`, `rpc_update_sacrifice_core`, `rpc_move_shareholder_to_sacrifice`. Dönüş tipi değişiminde önce `DROP FUNCTION rpc_move_shareholder_to_sacrifice(text,uuid,uuid,uuid)`.
- **Tetikleyici düzeltmesi** (`fix_live_scale_shareholder_sync_trigger_2026_03_30.sql`): `update_shareholder_amounts_on_sacrifice_price_change` — sabit → canlı geçişte eski mantık `fee + NULL share_price` → `total_amount` NULL (23502) üretiyordu. Canlı + toplam tutar varsa `rebalance_live_scale_shareholders`; canlı + tutar yoksa yalnızca `delivery_fee`; sabitte eski formül.

## Uygulama

- Admin: Hisse fiyatı hücresi — sabit / canlı sekmesi; canlıda kg ve toplam tutar isteğe bağlı PATCH (boş alan DB’deki değeri silmez).
- Hisse Al: Canlı satırlarda “Hisse Bedeli” sütununda yalnızca **Canlı Baskül** (kg/tutar bu tabloda yok); detay hisse sorgula / özet ekranlarında.
- Audit: `log_sacrifice_changes` birleşik dosyasında canlı alan metinleri (`npm run db:merge:log-sacrifice-changes`).

## İlişkili dosyalar

- `.project-architecture/db/tables/sacrifice_animals/table.sql`
- `.project-architecture/db/tables/shareholders/functions_and_triggers/rebalance_live_scale_shareholders.sql`
- `.project-architecture/db/tables/sacrifice_animals/functions_and_triggers/update_shareholder_amounts_on_sacrifice_price_change.sql`
- `.cursor/rules/supabase-sql-execution-mcp.mdc` — uzun SQL MCP sınırları
