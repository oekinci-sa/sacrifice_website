-- Trigger fonksiyonu 'timed out' yerine 'timed_out' kullanmalı (constraint ile uyumlu)
CREATE OR REPLACE FUNCTION public.handle_reservation_deactivation()
RETURNS TRIGGER AS $$
DECLARE
  current_empty INT;
BEGIN
  IF OLD.status = 'active' AND NEW.status IN ('canceled', 'timed_out', 'expired') THEN
    SELECT empty_share INTO current_empty
    FROM sacrifice_animals
    WHERE sacrifice_id = NEW.sacrifice_id;

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

    UPDATE sacrifice_animals
    SET empty_share = empty_share + NEW.share_count
    WHERE sacrifice_id = NEW.sacrifice_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
