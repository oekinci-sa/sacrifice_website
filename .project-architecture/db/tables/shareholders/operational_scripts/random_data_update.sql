-- shareholders tablosunda sacrifice_id, share_price, purchase_time güncelleme
-- sacrifice_id: sacrifice_animals tablosundan döngüsel, share_price: 30000-78000 döngüsel, purchase_time: 2025-02-01 - 2025-04-15 random
-- NOT: sacrifice_id ve shareholder_id artık UUID; bu script sacrifice_animals'dan gerçek ID'leri kullanır
DO $$
DECLARE
    rec RECORD;
    i INTEGER := 1;
    sacrifice_ids UUID[];
    sacrifice_index INTEGER := 1;
    price_values NUMERIC[] := ARRAY[30000, 36000, 42000, 48000, 54000, 60000, 66000, 72000, 78000];
    price_index INTEGER := 1;
    current_price NUMERIC;
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

        current_price := price_values[price_index];
        UPDATE shareholders
        SET share_price = current_price
        WHERE shareholder_id = rec.shareholder_id;

        price_index := price_index + 1;
        IF price_index > array_length(price_values, 1) THEN
            price_index := 1;
        END IF;

        random_time := '2025-02-01'::TIMESTAMP + (random() * (EXTRACT(EPOCH FROM '2025-04-15'::TIMESTAMP - '2025-02-01'::TIMESTAMP)) * INTERVAL '1 second');

        UPDATE shareholders
        SET purchase_time = random_time
        WHERE shareholder_id = rec.shareholder_id;

        RAISE NOTICE 'Updated: ID: %, Sacrifice: %, Price: %, Time: %', rec.shareholder_id, sacrifice_ids[sacrifice_index - 1], current_price, random_time;
        i := i + 1;
    END LOOP;

    RAISE NOTICE 'Toplam % adet kayıt güncellendi.', i - 1;
END $$;
