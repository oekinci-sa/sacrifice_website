-- empty_share + dolu hisse sayısının 7'ye eşit olup olmadığını kontrol eder.
-- Hissedar sayısı + boş hisse ≠ 7 olan kurbanlıkları listeler.

CREATE OR REPLACE VIEW mismatched_shares AS
SELECT 
    s.sacrifice_id AS sacrifice_id,
    COUNT(sh.sacrifice_id) AS shareholder_count,
    s.empty_share,
    COUNT(sh.sacrifice_id) + s.empty_share AS total_shares,
    'Hissedar sayısı ile boş hisse sayısı toplamı 7 değil! Hata boş hisse sayısı değerinde olabilir.' AS explanation
FROM sacrifice_animals s
LEFT JOIN shareholders sh ON s.sacrifice_id = sh.sacrifice_id
GROUP BY s.sacrifice_id, s.empty_share
HAVING (COUNT(sh.sacrifice_id) + s.empty_share) <> 7;
