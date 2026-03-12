-- Kurbanlık listesini sacrifice_no sırasına göre döndürür.
-- Temel alanları içerir (slaughter_time, butcher_time, delivery_time hariç).

CREATE VIEW sacrifice_animals_view AS
SELECT sacrifice_id, sacrifice_no, sacrifice_time, share_weight, share_price, empty_share
FROM sacrifice_animals
ORDER BY sacrifice_no;
