-- sacrifice_animals.share_price ile shareholders.share_price karşılaştırması.
-- Uyuşmayan hisse bedellerini listeler.

CREATE VIEW mismatched_share_prices AS
SELECT
  sa.sacrifice_id,
  sa.share_price AS sacrifice_share_price,
  sh.share_price AS shareholder_share_price,
  sh.shareholder_name,
  ((('Hisse bedeli uyuşmazlığı! Kurban tablosunda: ' :: TEXT || sa.share_price) || ' TL, Hissedar tablosunda: ' :: TEXT) || sh.share_price) || ' TL' :: TEXT AS explanation 
FROM
  sacrifice_animals sa
  JOIN shareholders sh ON sa.sacrifice_id = sh.sacrifice_id 
WHERE
  sa.share_price <> sh.share_price;
