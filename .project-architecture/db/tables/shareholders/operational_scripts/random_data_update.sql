-- shareholders tablosunda sacrifice_id, purchase_time güncelleme
-- share_price artık shareholders'da yok (sacrifice_animals ile JOIN'den alınır)
DO $$
DECLARE
    rec RECORD;
    i INTEGER := 1;
    sacrifice_ids UUID[];
    sacrifice_index INTEGER := 1;
    random_time TIMESTAMP;
BEGIN
    SELECT ARRAY_AGG(sacrifice_id ORDER BY sacrifice_no) INTO sacrifice_ids FROM sacrifice_animals;
    IF sacrifice_ids IS NULL OR array_length(sacrifice_ids, 1) = 0 THEN
        RAISE EXCEPTION 'sacrifice_animals tablosunda kayıt yok';
    END IF;

    FOR rec IN (SELECT shareholder_id FROM shareholders ORDER BY shareholder_id) LOOP
        UPDATE shareholders
        SET sacrifice_id = sacrifice_ids[sacrifice_index]
        WHERE shareholder_id = rec.shareholder_id;

        sacrifice_index := sacrifice_index + 1;
        IF sacrifice_index > array_length(sacrifice_ids, 1) THEN
            sacrifice_index := 1;
        END IF;

        random_time := '2025-02-01'::TIMESTAMP + (random() * (EXTRACT(EPOCH FROM '2025-04-15'::TIMESTAMP - '2025-02-01'::TIMESTAMP)) * INTERVAL '1 second');

        UPDATE shareholders
        SET purchase_time = random_time
        WHERE shareholder_id = rec.shareholder_id;

        RAISE NOTICE 'Updated: ID: %, Sacrifice: %, Time: %', rec.shareholder_id, sacrifice_ids[sacrifice_index - 1], random_time;
        i := i + 1;
    END LOOP;

    RAISE NOTICE 'Toplam % adet kayıt güncellendi.', i - 1;
END $$;
