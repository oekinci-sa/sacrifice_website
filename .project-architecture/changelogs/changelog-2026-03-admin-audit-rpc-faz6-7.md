# Changelog: Admin audit RPC — Faz 6 ve 7 (Mart 2026)

## Faz 6 — `stage_metrics`

- **RPC:** `rpc_update_stage_metrics(p_actor, p_tenant_id, p_stage, p_current_sacrifice_number)` — `SECURITY DEFINER`, `set_config('app.actor', …)`, aşama doğrulaması (`slaughter_stage` | `butcher_stage` | `delivery_stage`).
- **change_logs:** Tablo adı `Aşama Metrikleri`; sütun `Anlık kurban numarası`; açıklama aşama kodu ile.
- **API:** `POST /api/update-stage-metrics` — `getServerSession`, `sessionHasAdminEditorOrSuperRole`, `getSessionActorEmail` (zorunlu); Türkçe hata mesajları.
- **Dosyalar:** [../db/migrations/trigger_only_change_logs_2026_03.sql](../db/migrations/trigger_only_change_logs_2026_03.sql) (canlı DB’de `change_logs` artık trigger ile; RPC’de doğrudan INSERT yok), [../db/tables/stage_metrics/functions_and_triggers/rpc_update_stage_metrics.sql](../db/tables/stage_metrics/functions_and_triggers/rpc_update_stage_metrics.sql).

## Faz 7 — Dokümantasyon senkronu

- [../features.md](../features.md): Faz 6–7 maddeleri + changelog linki.
- [../role-permissions.md](../role-permissions.md): `POST /api/update-stage-metrics` yetki tablosu + ilgili dosya satırı.
- [../user-flows.md](../user-flows.md): Aşama metrikleri akışı; kurban güncelleme yöntemleri (PUT/POST) düzeltmesi.
- [../pages/admin-pages.md](../pages/admin-pages.md): `/kurban-admin/asama-metrikleri` bölümü.

## Önceki fazlar (özet)

Faz 1–5: shareholders / sacrifice / mismatch / users RPC’leri ve `change_logs` entegrasyonu — detay için [../features.md](../features.md) «last_edited_by / change_owner» bölümü.
