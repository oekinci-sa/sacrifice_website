-- ===============================================
-- Açıklama: Yeni kullanıcı eklendiğinde user_profiles tablosuna
--           otomatik kayıt oluşturur. Auth'dan gelen full_name
--           bilgisini kullanır. Genellikle auth.users üzerinde
--           AFTER INSERT trigger ile kullanılır.
-- Trigger   : (auth.users veya public.users üzerinde tanımlanmalı)
-- ===============================================

CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  COST 100;
