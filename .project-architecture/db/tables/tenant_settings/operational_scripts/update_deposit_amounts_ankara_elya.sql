-- Kapora tutarları: Ankara Kurban 5000 ₺, Elya 10000 ₺ (tenant_settings.logo_slug)
-- İstemci fallback'leri ile uyumlu; gerektiğinde tekrar çalıştırılabilir.

UPDATE public.tenant_settings
SET deposit_amount = 5000
WHERE logo_slug = 'ankara-kurban';

UPDATE public.tenant_settings
SET deposit_amount = 10000
WHERE logo_slug = 'elya-hayvancilik';

-- Doğrulama:
-- SELECT tenant_id, logo_slug, deposit_amount FROM public.tenant_settings WHERE logo_slug IN ('ankara-kurban', 'elya-hayvancilik');
