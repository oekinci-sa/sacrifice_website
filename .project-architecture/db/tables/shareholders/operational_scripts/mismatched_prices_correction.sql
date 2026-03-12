-- Önce uyuşmazlıkları kontrol eden ve gösteren bir sorgu:
WITH mismatched_prices AS (
   SELECT
       sh.shareholder_id,
       sa.sacrifice_id,
       sa.share_price AS correct_price,
       sh.share_price AS current_price,
       sh.shareholder_name
   FROM sacrifice_animals sa
   INNER JOIN shareholders sh ON sa.sacrifice_id = sh.sacrifice_id
   WHERE sa.share_price <> sh.share_price
)
SELECT
   sacrifice_id,
   shareholder_name,
   current_price AS "Mevcut Hisse Bedeli",
   correct_price AS "Olması Gereken Hisse Bedeli"
FROM mismatched_prices;

-- Sonra güncelleme işlemini yap
UPDATE shareholders sh
SET
   share_price = sa.share_price,
   last_edited_time = now(),
   last_edited_by = 'Sistem (Otomatik Düzeltme)'
FROM sacrifice_animals sa
WHERE sh.sacrifice_id = sa.sacrifice_id
AND sh.share_price <> sa.share_price;
