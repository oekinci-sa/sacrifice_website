-- ===============================================
-- Açıklama: reservation_transactions tablosundaki share_count değişikliklerini
--           takip eder ve sacrifice_animals.empty_share alanını günceller.
--           INSERT'ta boş hisseyi azaltır, UPDATE'te farkı uygular.
--           Sınır aşımlarında failed_reservation_transactions_logs'a yazar.
-- Trigger   : trg_update_empty_share (BEFORE INSERT OR UPDATE)
--
-- Race condition koruması:
--   SELECT ... FOR UPDATE ile sacrifice_animals satırını kilitler; aynı anda
--   gelen iki rezervasyon isteği sıra bekler, lost update olmaz.
--   UPDATE delta tabanlıdır (empty_share - delta) — mutlak değer yazılmaz.
-- ===============================================

CREATE OR REPLACE FUNCTION update_empty_share()
RETURNS TRIGGER AS $$
DECLARE
    delta INT;
    current_empty INT;
    rows_affected INT;
BEGIN
    IF NEW.status = 'active' THEN
        IF TG_OP = 'INSERT' THEN
            -- Satırı kilitle (FOR UPDATE) — eşzamanlı INSERT'larda lost update önler
            SELECT empty_share INTO current_empty
            FROM sacrifice_animals
            WHERE sacrifice_id = NEW.sacrifice_id
            FOR UPDATE;

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

            -- Delta güncelleme: mutlak değer yerine azaltma; CHECK (0..7) son güvenlik ağı
            UPDATE sacrifice_animals
            SET empty_share = empty_share - NEW.share_count
            WHERE sacrifice_id = NEW.sacrifice_id;

        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.share_count <> OLD.share_count THEN
                delta := NEW.share_count - OLD.share_count;

                -- Satırı kilitle (FOR UPDATE) — eşzamanlı güncelleme yarışını önler
                SELECT empty_share INTO current_empty
                FROM sacrifice_animals
                WHERE sacrifice_id = NEW.sacrifice_id
                FOR UPDATE;

                -- Güvenlik sınırı kontrolü
                IF current_empty - delta < 0 OR current_empty - delta > 7 THEN
                    INSERT INTO failed_reservation_transactions_logs (
                        transaction_id, sacrifice_id, attempted_share_change, current_empty_share, reason
                    ) VALUES (
                        NEW.transaction_id, NEW.sacrifice_id, -delta, current_empty,
                        'UPDATE işlemi ile boş hisse sınırı aşıldı (0-7)'
                    );
                    RETURN NEW;
                END IF;

                -- Delta güncelleme: WHERE koşulu ile çift güvenlik ağı
                UPDATE sacrifice_animals
                SET empty_share = empty_share - delta
                WHERE sacrifice_id = NEW.sacrifice_id
                  AND (empty_share - delta) BETWEEN 0 AND 7;

                GET DIAGNOSTICS rows_affected = ROW_COUNT;
                IF rows_affected = 0 THEN
                    INSERT INTO failed_reservation_transactions_logs (
                        transaction_id, sacrifice_id, attempted_share_change, current_empty_share, reason
                    ) VALUES (
                        NEW.transaction_id, NEW.sacrifice_id, -delta, current_empty,
                        'UPDATE delta güncelleme uygulanamadı (CHECK sınırı ihlali)'
                    );
                END IF;
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
