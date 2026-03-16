-- Ödeme hesaplaması tutarsızlıklarını kontrol eder.
-- total_amount <> (delivery_fee + sacrifice_animals.share_price) olan kayıtları listeler.
-- share_price sacrifice_animals ile JOIN'den alınır.

CREATE OR REPLACE VIEW invalid_payments_view AS
SELECT 
    sh.shareholder_id,
    sh.shareholder_name,
    sh.phone_number,
    sh.sacrifice_id,
    sh.delivery_fee,
    sa.share_price,
    sh.total_amount,
    sh.paid_amount,
    sh.remaining_payment,
    (COALESCE(sh.delivery_fee, 0) + COALESCE(sa.share_price, 0)) AS expected_total,
    (sh.paid_amount + sh.remaining_payment) AS actual_total,
    sh.last_edited_time,
    sh.last_edited_by,
    sh.notes
FROM shareholders sh
JOIN sacrifice_animals sa ON sh.sacrifice_id = sa.sacrifice_id
WHERE (COALESCE(sh.delivery_fee, 0) + COALESCE(sa.share_price, 0)) <> (sh.paid_amount + sh.remaining_payment);
