-- mismatched_shares view'a last_edited_time ekle (sıralama için)
-- En son değişen uyumsuzluk en üstte görünsün

CREATE OR REPLACE VIEW mismatched_shares AS
SELECT 
    s.sacrifice_id AS sacrifice_id,
    s.tenant_id AS tenant_id,
    s.sacrifice_year,
    s.sacrifice_no,
    COUNT(sh.sacrifice_id) AS shareholder_count,
    s.empty_share,
    s.last_edited_time
FROM sacrifice_animals s
LEFT JOIN shareholders sh ON s.sacrifice_id = sh.sacrifice_id
GROUP BY s.sacrifice_id, s.tenant_id, s.sacrifice_year, s.sacrifice_no, s.empty_share, s.last_edited_time
HAVING (COUNT(sh.sacrifice_id) + s.empty_share) <> 7;
