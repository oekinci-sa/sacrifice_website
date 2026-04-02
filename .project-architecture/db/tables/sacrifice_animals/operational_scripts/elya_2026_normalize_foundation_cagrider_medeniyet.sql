-- Elya Hayvancılık (tenant …0003) — referans (foundation) metnindeki
-- Çağrıder / Medeniyet yazılışlarını ÇAĞRIDER ve MEDENİYET olarak birleştirir.
--
-- Çalıştırmadan önce yedek alın. Yıl ve tenant gerektiğinde düzenleyin.

BEGIN;

-- Ön izleme (salt okunur)
/*
SELECT
  sa.sacrifice_no,
  sa.foundation AS eski,
  trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          trim(sa.foundation),
          'çağrıder',
          'ÇAĞRIDER',
          'gi'
        ),
        'cagrider',
        'ÇAĞRIDER',
        'gi'
      ),
      'medeniyet',
      'MEDENİYET',
      'gi'
    )
  ) AS yeni
FROM public.sacrifice_animals sa
WHERE sa.tenant_id = '00000000-0000-0000-0000-000000000003'::uuid
  AND sa.sacrifice_year = 2026
  AND sa.foundation IS NOT NULL
  AND trim(sa.foundation) <> trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          trim(sa.foundation),
          'çağrıder',
          'ÇAĞRIDER',
          'gi'
        ),
        'cagrider',
        'ÇAĞRIDER',
        'gi'
      ),
      'medeniyet',
      'MEDENİYET',
      'gi'
    )
  );
*/

UPDATE public.sacrifice_animals sa
SET
  foundation = trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          trim(sa.foundation),
          'çağrıder',
          'ÇAĞRIDER',
          'gi'
        ),
        'cagrider',
        'ÇAĞRIDER',
        'gi'
      ),
      'medeniyet',
      'MEDENİYET',
      'gi'
    )
  ),
  last_edited_by = 'SQL normalize foundation Çağrıder/Medeniyet',
  last_edited_time = now()
WHERE sa.tenant_id = '00000000-0000-0000-0000-000000000003'::uuid
  AND sa.sacrifice_year = 2026
  AND sa.foundation IS NOT NULL
  AND trim(sa.foundation) <> trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          trim(sa.foundation),
          'çağrıder',
          'ÇAĞRIDER',
          'gi'
        ),
        'cagrider',
        'ÇAĞRIDER',
        'gi'
      ),
      'medeniyet',
      'MEDENİYET',
      'gi'
    )
  );

COMMIT;
