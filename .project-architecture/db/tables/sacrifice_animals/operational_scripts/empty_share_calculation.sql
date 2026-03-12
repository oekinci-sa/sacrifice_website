-- Açıklama: Her kurbanlık için empty_share değerini shareholders tablosundaki
--           kayıt sayısına göre yeniden hesaplar. (7 - hissedar sayısı = boş hisse)

UPDATE sacrifice_animals
SET empty_share = 7 - (
  SELECT COUNT(*)
  FROM shareholders
  WHERE shareholders.sacrifice_id = sacrifice_animals.sacrifice_id
);
