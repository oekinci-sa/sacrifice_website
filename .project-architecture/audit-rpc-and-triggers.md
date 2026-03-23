# Change logs, tetikleyiciler ve RPC’ler

## İlke

- **Satır içi audit (`change_logs`)** tablo tetikleyicileriyle yazılır; uygulama doğrudan tabloya yazdığında da tetikleyiciler çalışır.
- **Kim yaptı (`app.actor`)** Postgres GUC olarak `PERFORM set_config('app.actor', p_actor, true)` ile RPC içinde set edilir; log fonksiyonları önce bunu, yoksa `last_edited_by` vb. fallback’leri kullanır.
- **API (service_role)** mümkün olduğunca **tek giriş noktası** olarak SECURITY DEFINER RPC’leri kullanır; böylece hem tenant filtresi hem aktör tek yerde toplanır.

## Aktif RPC’ler (özet)

| RPC | Amaç |
|-----|------|
| `rpc_create_sacrifice` | Yeni `sacrifice_animals` satırı + INSERT tetikleyicisi + `app.actor` |
| `rpc_update_sacrifice_core` | Kurbanlık alanları (çekirdek + `empty_share` + kesim/teslim zamanları) + `app.actor` |
| `rpc_delete_sacrifice` | Kurban silme (cascade mantığı projede tanımlı olduğu şekilde) |
| `rpc_insert_shareholders_batch` | Toplu hissedar ekleme + `app.actor` |
| `rpc_update_shareholder` | Hissedar güncelleme (e-posta, `contacted_at` dahil) + `app.actor` |
| `rpc_delete_shareholder` | Hissedar silme |
| `rpc_update_stage_metrics` | Aşama metrikleri |
| `rpc_acknowledge_mismatch` / `rpc_revoke_mismatch` | Uyuşmazlık onayı |
| Kullanıcı / tenant RPC’leri | `rpc_create_user`, `rpc_update_user`, `rpc_delete_user`, `rpc_patch_user_tenant_status` (ilgili migration dosyalarına bakın) |

Kaynak SQL: `.project-architecture/db/tables/*/functions_and_triggers/*.sql`

## Kaldırılan RPC’ler ve gerekçe

### `rpc_update_sacrifice_timing`

- **Ne yapıyordu:** Yalnızca `slaughter_time` / `butcher_time` / `delivery_time` ve `last_edited_*` güncelliyordu.
- **Neden kaldırıldı:** Aynı iş, `rpc_update_sacrifice_core` içinde `p_patch` ile (ilgili zaman alanları + `last_edited_by` / `last_edited_time`) tek RPC’de yapılabiliyor; davranış ve audit tek yerde toplanır, imza sayısı azalır.

### `rpc_update_sacrifice_share`

- **Ne yapıyordu:** Yalnızca `empty_share` ve `last_edited_*` güncelliyordu.
- **Neden kaldırıldı:** `empty_share` zaten `rpc_update_sacrifice_core` patch’inin parçası; ayrı fonksiyon tekrar eden kod ve bakım yükü yaratıyordu.

## API eşlemesi (güncel)

- `POST /api/update-sacrifice-share` → `rpc_update_sacrifice_core` (`empty_share` patch).
- `POST /api/update-sacrifice-timing` → `rpc_update_sacrifice_core` (tek ilgili zaman alanı patch).
- `POST /api/create-sacrifice` → `rpc_create_sacrifice`.
- `POST /api/create-shareholders` → `rpc_insert_shareholders_batch`.
- `POST /api/reset-shares` → `rpc_update_sacrifice_core` (hisse al akışı aktörü ile).
- `PATCH /api/admin/shareholders/[id]/contacted` → `rpc_update_shareholder` (`contacted_at`).

## Migration

Tek seferlik uygulanan betik: `.project-architecture/db/migrations/consolidate_audit_rpc_2026_03_20.sql`
