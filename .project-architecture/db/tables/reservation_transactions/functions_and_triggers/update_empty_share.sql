-- ===============================================
-- Açıklama: reservation_transactions tablosundaki share_count değişikliklerini
--           takip eder ve sacrifice_animals.empty_share alanını günceller.
--           INSERT'ta boş hisseyi azaltır, UPDATE'te farkı uygular.
--           Sınır aşımlarında failed_reservation_transactions_logs'a yazar.
-- Trigger   : trg_update_empty_share (BEFORE INSERT OR UPDATE)
-- ===============================================

CREATE OR REPLACE FUNCTION update_empty_share()
RETURNS TRIGGER AS $$
DECLARE
    delta INT;
    current_empty INT;
BEGIN
    IF NEW.status = 'active' THEN
        IF TG_OP = 'INSERT' THEN
            -- Mevcut boş hisseyi al
            SELECT empty_share INTO current_empty
            FROM sacrifice_animals
            WHERE sacrifice_id = NEW.sacrifice_id;

            -- Yeni değer geçerliyse güncelle, değilse logla
            IF current_empty - NEW.share_count < 0 THEN
                INSERT INTO failed_reservation_transactions_logs (
                    transaction_id, sacrifice_id, attempted_share_change, current_empty_share, reason
                ) VALUES (
                    NEW.transaction_id, NEW.sacrifice_id, -NEW.share_count, current_empty,
                    'INSERT işlemi ile boş hisse negatif olacaktı'
                );
                RETURN NEW;
            END IF;

            UPDATE sacrifice_animals
            SET empty_share = current_empty - NEW.share_count
            WHERE sacrifice_id = NEW.sacrifice_id;

        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.share_count <> OLD.share_count THEN
                delta := NEW.share_count - OLD.share_count;

                -- Mevcut boş hisseyi al
                SELECT empty_share INTO current_empty
                FROM sacrifice_animals
                WHERE sacrifice_id = NEW.sacrifice_id;

                -- Güncelleme geçerliyse uygula, değilse logla
                IF current_empty - delta < 0 OR current_empty - delta > 7 THEN
                    INSERT INTO failed_reservation_transactions_logs (
                        transaction_id, sacrifice_id, attempted_share_change, current_empty_share, reason
                    ) VALUES (
                        NEW.transaction_id, NEW.sacrifice_id, -delta, current_empty,
                        'UPDATE işlemi ile boş hisse sınırı aşıldı (0-7)'
                    );
                    RETURN NEW;
                END IF;

                UPDATE sacrifice_animals
                SET empty_share = current_empty - delta
                WHERE sacrifice_id = NEW.sacrifice_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_empty_share
BEFORE INSERT OR UPDATE ON reservation_transactions
FOR EACH ROW
EXECUTE FUNCTION update_empty_share();
