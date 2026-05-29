-- homepage_mode: kurban_gunu_sonrasi (kurban günü sonrası teşekkür ekranı)

ALTER TABLE public.tenant_settings
  DROP CONSTRAINT IF EXISTS tenant_settings_homepage_mode_check;

ALTER TABLE public.tenant_settings
  ADD CONSTRAINT tenant_settings_homepage_mode_check
  CHECK (homepage_mode IN (
    'bana_haber_ver',
    'geri_sayim',
    'live',
    'tesekkur',
    'follow_up',
    'anasayfa',
    'takip',
    'kurban_gunu_sonrasi'
  ));
