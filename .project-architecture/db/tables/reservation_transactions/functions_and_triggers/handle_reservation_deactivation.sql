-- ===============================================
-- Açıklama: Rezervasyon 'canceled', 'timed_out', 'expired' veya 'offline' durumuna
--           geçtiğinde sacrifice_animals.empty_share değerini share_count
--           kadar artırır. Boş hisseyi geri serbest bırakır.
--           Sınır (7) aşımında failed_reservation_transactions_logs'a yazar.
-- Trigger   : trg_handle_reservation_deactivation (AFTER UPDATE)
--
-- Race condition koruması:
--   SELECT ... FOR UPDATE ile sacrifice_animals satırını kilitler; eşzamanlı
--   deactivation ve yeni rezervasyon işlemleri sıraya girer, stale read olmaz.
-- ===============================================

CREATE OR REPLACE FUNCTION public.handle_reservation_deactivation()
RETURNS TRIGGER AS $$
DECLARE
  current_empty INT;
BEGIN
  IF OLD.status = 'active' AND NEW.status IN ('canceled', 'timed_out', 'expired', 'offline') THEN
    -- Satırı kilitle (FOR UPDATE) — eşzamanlı işlemlerde stale read önler
    SELECT empty_share INTO current_empty
    FROM sacrifice_animals
    WHERE sacrifice_id = NEW.sacrifice_id
    FOR UPDATE;

    -- Kilit sonrası taze değerle sınır kontrolü
    IF current_empty + NEW.share_count > 7 THEN
      INSERT INTO failed_reservation_transactions_logs (
        transaction_id, sacrifice_id, attempted_share_change,
        current_empty_share, new_status, reason
      ) VALUES (
        NEW.transaction_id, NEW.sacrifice_id, NEW.share_count,
        current_empty, NEW.status,
        'Boş hisse sınırı (7) aşıldığı için işlem uygulanmadı.'
      );
      RETURN NEW;
    END IF;

    -- Delta güncelleme (zaten doğru pattern; kilit ile güçlendirildi)
    UPDATE sacrifice_animals
    SET empty_share = empty_share + NEW.share_count
    WHERE sacrifice_id = NEW.sacrifice_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_reservation_deactivation
AFTER UPDATE ON reservation_transactions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_reservation_deactivation();
