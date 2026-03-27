# Bugfix: Yinelenen hissedar silme tetikleyicisi (2026-03-27)

## Sorun

`shareholders` tablosunda **AFTER DELETE** olayına bağlı iki ayrı trigger
`sacrifice_animals.empty_share` değerini her hissedar silmede **iki kez +1** yapıyordu.
Beklenen artış +1 iken gerçekte +2 oluyordu (ör. 3 → 5 gibi).

| Trigger | Fonksiyon | Ne yapıyordu |
|---------|-----------|--------------|
| `trg_sync_empty_share_after_shareholder_delete` | `sync_empty_share_after_shareholder_delete()` | `empty_share + 1` (doğru, korundu) |
| ~~`trg_shareholder_delete`~~ | ~~`handle_shareholder_delete()`~~ | `empty_share + 1` (yinelenen, **kaldırıldı**) |

`handle_shareholder_delete` ayrıca `app.skip_empty_share_sync` ayarını okumuyordu;
bu yüzden `rpc_delete_sacrifice` sırasında skip flag ayarlanmış olsa bile
eski trigger yine de +1 ekleyebiliyordu.

## Tespit

Supabase `change_logs` kaydı incelendiğinde aynı `correlation_id` altında
iki ayrı `Boş Hisse` güncelleme satırı görüldü (3→4 ve 4→5).
`information_schema.triggers` sorgusuyla `trg_shareholder_delete` trigger'ının
`.project-architecture` dosyalarında karşılığı olmayan artık bir nesne olduğu tespit edildi.

## Düzeltme

```sql
DROP TRIGGER IF EXISTS trg_shareholder_delete ON public.shareholders;
DROP FUNCTION IF EXISTS public.handle_shareholder_delete();
```

Migration dosyası:
`.project-architecture/db/tables/shareholders/migrations/drop_duplicate_shareholder_delete_trigger_2026_03_27.sql`

## Etkilenen dosyalar

| Dosya | Değişiklik |
|-------|------------|
| DB (canlı) | `trg_shareholder_delete` ve `handle_shareholder_delete()` kaldırıldı |
| `db/tables/shareholders/migrations/drop_duplicate_shareholder_delete_trigger_2026_03_27.sql` | Migration oluşturuldu |
| `changelogs/changelog-2025-03-ui-improvements.md` | Eski trigger adı referansı düzeltildi |
| `audit-rpc-and-triggers.md` | Kaldırılan trigger kaydı eklendi |
