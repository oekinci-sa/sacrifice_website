-- Önce mevcut hesaplamaları kontrol eden sorgu
-- share_price sacrifice_animals ile JOIN'den alınır
WITH calculations AS (
   SELECT
       sh.shareholder_id,
       sh.shareholder_name,
       sh.delivery_fee,
       sa.share_price,
       sh.total_amount AS current_total,
       (COALESCE(sh.delivery_fee, 0) + COALESCE(sa.share_price, 0)) AS correct_total,
       sh.paid_amount,
       sh.remaining_payment AS current_remaining,
       ((COALESCE(sh.delivery_fee, 0) + COALESCE(sa.share_price, 0)) - sh.paid_amount) AS correct_remaining
   FROM shareholders sh
   JOIN sacrifice_animals sa ON sh.sacrifice_id = sa.sacrifice_id
   WHERE
       sh.total_amount <> (COALESCE(sh.delivery_fee, 0) + COALESCE(sa.share_price, 0)) OR
       sh.remaining_payment <> (sh.total_amount - sh.paid_amount)
)
SELECT
   shareholder_name,
   current_total AS "Mevcut Toplam",
   correct_total AS "Olması Gereken Toplam",
   current_remaining AS "Mevcut Kalan Ödeme",
   correct_remaining AS "Olması Gereken Kalan Ödeme"
FROM calculations;

-- Güncelleme işlemini yap
UPDATE shareholders sh
SET
   total_amount = COALESCE(sh.delivery_fee, 0) + COALESCE(sa.share_price, 0),
   remaining_payment = (COALESCE(sh.delivery_fee, 0) + COALESCE(sa.share_price, 0)) - sh.paid_amount,
   last_edited_time = now(),
   last_edited_by = 'Sistem (Otomatik Hesaplama)'
FROM sacrifice_animals sa
WHERE sh.sacrifice_id = sa.sacrifice_id
AND (
   sh.total_amount <> (COALESCE(sh.delivery_fee, 0) + COALESCE(sa.share_price, 0)) OR
   sh.remaining_payment <> (sh.total_amount - sh.paid_amount)
);
