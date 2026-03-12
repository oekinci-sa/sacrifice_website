-- Açıklama: sacrifice_animals tablosundaki sacrifice_no, sacrifice_time,
--           share_weight, share_price alanlarını döngüsel değerlerle doldurur.
--           Toplu veri güncellemesi için kullanılır.

-- Mevcut sacrifice_animals verilerini güncelleme scripti
-- sacrifice_no, sacrifice_time, share_weight, share_price döngüsel değerlerle doldurulur
DO $$
DECLARE
    rec RECORD;
    i INTEGER := 1;
    base_time TIME := '07:00:00';
    interval_minutes INTEGER := 6;
    new_time TIME;

    -- Döngüsel değerler için değişkenler
    weight_values INTEGER[] := ARRAY[26, 30, 34, 38, 42, 46, 50, 54, 58];
    weight_index INTEGER := 1;
    new_weight INTEGER;

    price_values INTEGER[] := ARRAY[30000, 36000, 42000, 48000, 54000, 60000, 66000, 72000, 78000];
    price_index INTEGER := 1;
    new_price INTEGER;
BEGIN
    -- İlk adım: Tüm sacrifice_no değerlerini geçici olarak negatif değerlere ayarlama
    -- Bu, tekil kısıtlama için çakışmaları önler
    UPDATE sacrifice_animals
    SET sacrifice_no = -sacrifice_no
    WHERE sacrifice_no > 0;

    -- İkinci adım: Kayıtları sırayla güncelleme
    FOR rec IN (SELECT sacrifice_id FROM sacrifice_animals ORDER BY sacrifice_id) LOOP
        -- Zamanı hesapla (her seferinde 6 dakika ekle)
        new_time := base_time + (interval_minutes * (i-1) || ' minutes')::INTERVAL;

        -- share_weight değerini döngüsel olarak al
        new_weight := weight_values[weight_index];
        weight_index := weight_index + 1;
        IF weight_index > array_length(weight_values, 1) THEN
            weight_index := 1;
        END IF;

        -- share_price değerini döngüsel olarak al
        new_price := price_values[price_index];
        price_index := price_index + 1;
        IF price_index > array_length(price_values, 1) THEN
            price_index := 1;
        END IF;

        -- Kaydı güncelle
        UPDATE sacrifice_animals
        SET
            sacrifice_no = i,
            sacrifice_time = new_time,
            share_weight = new_weight,
            share_price = new_price,
            last_edited_time = now(),
            last_edited_by = 'Admin Script',
            notes = COALESCE(notes, '') || ' | ' || 'Toplu güncellenmiştir.'
        WHERE sacrifice_id = rec.sacrifice_id;

        RAISE NOTICE 'Güncellendi: ID: %, No: %, Zaman: %, Ağırlık: %, Fiyat: %',
            rec.sacrifice_id, i, new_time, new_weight, new_price;

        i := i + 1;
    END LOOP;

    RAISE NOTICE 'Toplam % adet kayıt başarıyla güncellendi.', i-1;
END $$;
