-- Migration: Yinelenen boş hisse tetikleyicisini kaldır
-- Tarih   : 2026-03-27
-- Sorun   : shareholders tablosunda AFTER DELETE olayına bağlı iki ayrı trigger
--           (trg_shareholder_delete + trg_sync_empty_share_after_shareholder_delete)
--           her hissedar silmede empty_share'i iki kez +1 yapıyordu (+2 toplam).
-- Düzeltme: Eski, artık kullanılmayan handle_shareholder_delete fonksiyonu ve
--           trg_shareholder_delete trigger'ı kaldırıldı.
--           Doğru/güncel olan trg_sync_empty_share_after_shareholder_delete korunuyor.

DROP TRIGGER IF EXISTS trg_shareholder_delete ON public.shareholders;
DROP FUNCTION IF EXISTS public.handle_shareholder_delete();
