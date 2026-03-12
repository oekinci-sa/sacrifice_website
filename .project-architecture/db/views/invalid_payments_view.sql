-- Ödeme hesaplaması tutarsızlıklarını kontrol eder.
-- total_amount <> (delivery_fee + share_price) veya
-- (paid_amount + remaining_payment) <> total_amount olan kayıtları listeler.

CREATE VIEW invalid_payments_view AS
SELECT 
    shareholder_id,
    shareholder_name,
    phone_number,
    sacrifice_id,
    delivery_fee,
    share_price,
    total_amount,
    paid_amount,
    remaining_payment,
    (delivery_fee + share_price) AS expected_total,
    (paid_amount + remaining_payment) AS actual_total,
    last_edited_time,
    last_edited_by,
    notes
FROM shareholders
WHERE (delivery_fee + share_price) <> (paid_amount + remaining_payment);
