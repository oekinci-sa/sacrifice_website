-- İletişim sayfası: blok başlıkları + sosyal medya (tenant bazlı)

ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS contact_address_label TEXT,
  ADD COLUMN IF NOT EXISTS contact_email_label TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone_label TEXT,
  ADD COLUMN IF NOT EXISTS contact_social_links JSONB DEFAULT '[]'::jsonb;

-- Ankara Kurban (Kahramankazan)
UPDATE public.tenant_settings
SET
  contact_address_label = 'Adres',
  contact_email_label = 'E-maillerinize 24 saat içerisinde dönüş sağlıyoruz.',
  contact_phone_label = 'Bizi arayın.',
  contact_social_links = jsonb_build_array(
    jsonb_build_object('href', 'https://www.facebook.com/imhankara06', 'icon_name', 'bi bi-facebook', 'color', 'text-blue-600'),
    jsonb_build_object('href', 'https://twitter.com/imhankara', 'icon_name', 'bi bi-twitter-x', 'color', 'text-black'),
    jsonb_build_object('href', 'https://www.instagram.com/imhankara06/', 'icon_name', 'bi bi-instagram', 'color', 'text-pink-600'),
    jsonb_build_object('href', 'https://www.youtube.com/@insanvemedeniyethareketiankara', 'icon_name', 'bi bi-youtube', 'color', 'text-red-600'),
    jsonb_build_object('href', 'http://www.imhankara.org.tr/', 'icon_name', 'bi bi-globe', 'color', 'text-sky-500')
  )
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'::uuid;

-- Elya Hayvancılık (Gölbaşı)
UPDATE public.tenant_settings
SET
  contact_address_label = 'Adres',
  contact_email_label = 'E-posta',
  contact_phone_label = 'Telefon',
  contact_social_links = jsonb_build_array(
    jsonb_build_object('href', 'https://www.instagram.com/elyabesiankara', 'icon_name', 'bi bi-instagram', 'color', 'text-pink-600'),
    jsonb_build_object('href', 'https://www.facebook.com/share/1XbD6AepLA/', 'icon_name', 'bi bi-facebook', 'color', 'text-blue-600'),
    jsonb_build_object('href', 'https://youtube.com/@elyabesiciftligi', 'icon_name', 'bi bi-youtube', 'color', 'text-red-600')
  )
WHERE tenant_id = '00000000-0000-0000-0000-000000000003'::uuid;

-- Test tenant: kısa başlıklar, sosyal yok
UPDATE public.tenant_settings
SET
  contact_address_label = COALESCE(NULLIF(trim(contact_address_label), ''), 'Adres'),
  contact_email_label = COALESCE(NULLIF(trim(contact_email_label), ''), 'E-posta'),
  contact_phone_label = COALESCE(NULLIF(trim(contact_phone_label), ''), 'Telefon'),
  contact_social_links = COALESCE(contact_social_links, '[]'::jsonb)
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'::uuid;
