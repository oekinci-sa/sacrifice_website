-- second_phone_number: Adrese teslim seçildiğinde zorunlu ikinci iletişim numarası
-- phone_number ile aynı format (+90...)
ALTER TABLE "public"."shareholders"
ADD COLUMN IF NOT EXISTS "second_phone_number" VARCHAR(13) NULL;
