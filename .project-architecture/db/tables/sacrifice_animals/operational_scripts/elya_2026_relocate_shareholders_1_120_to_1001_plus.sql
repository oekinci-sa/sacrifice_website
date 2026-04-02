-- Elya Hayvancılık (tenant …0003) — 2026 kurbanlık 1–120 arasındaki hissedarları,
-- 1001–1180 aralığındaki uygun hisse bedeli (kg + fiyat) veya canlı baskül eşleşmesi olan
-- boş hissesi olan kurbanlıklara taşır.
--
-- ÖNEMLİ: Taşıma `public.rpc_move_shareholder_to_sacrifice` ile yapılır (empty_share tutarları,
-- canlı baskül rebalance vb. uygulama ile uyumlu).
--
-- Eşleşme kuralları:
--   • Sabit: kaynak `pricing_mode = 'fixed'` ise hedef de `fixed` olmalı; `share_weight` ve
--     `share_price` kaynak kurbanlık ile aynı olmalı; hedefte `empty_share >= 1`.
--   • Canlı baskül: kaynak `live_scale` ise hedef de `live_scale` ve `empty_share >= 1`.
--   • Hedef seçimi: aynı koşulu sağlayan kurbanlıklar arasında en küçük `sacrifice_no` (FIFO).
--
-- Concurrency / güvenlik:
--   • Hedef seçiminde `FOR UPDATE … SKIP LOCKED`: paralel taşıma işlemlerinde başka transaction’ın
--     kilitlemiş olduğu satır atlanır; çift atama riski azalır.
--   • `rpc_move_shareholder_to_sacrifice` içinde hedef için `empty_share < 1` tekrar kontrol edilir
--     (`target_sacrifice_full`); seçim ile RPC arasında yarış olsa bile tutarsızlık burada yakalanır.
--
-- Canlı baskül ve kg:
--   • Şemada `share_weight` canlı baskülde genelde NULL; toplam canlı ağırlık `live_scale_total_kg`.
--   • Bu script canlı baskülde yalnızca `pricing_mode` eşler (iş kuralın böyle). İleride “aynı canlı
--     kg’ye taşı” istersen, kaynak/hedef `live_scale_total_kg` için `IS NOT DISTINCT FROM` (veya
--     aralık) koşulu eklenebilir; çoğu kayıtta kg boş olduğu için varsayılan olarak eklenmedi.
--
-- Son MCP kontrolü (Supabase, bu dosya güncellenirken):
--   • 23 kg sabit: 1–120’de talep 1; 1001–1180’de aynı fiyat/kg için toplam boş hisse yeterli (OK).
--     23 kg hedef kurbanlıklar (1062–1067) empty_share>0 iken script ilk uygun numarayı seçer.
--   • Diğer sabit kg grupları: kapasite yeterli (OK).
--   • Canlı baskül: 1–120’de talep 1; 1001–1180 arasında empty_share>0 olan canlı baskül yok (YETERSİZ).
--     Bu hissedar [ATLA] kalır; taşımak için önce 1001+ tarafta bir canlı baskülde boş hisse açılmalı.
--
-- Çalıştırmadan önce aşağıdaki “Ön kontrol” SELECT’lerini çalıştırın.
-- Bu dosyayı yedekten sonra tek seferde çalıştırın; NOT: bir hata yakalanırsa döngü devam eder,
-- başarılı taşımalar aynı transaction içinde kalır.

-- ============================================================================
-- ÖN KONTROL (salt okunur; isteğe bağlı)
-- ============================================================================

-- Talep (1–120) vs aralık 1001–1180’de boş hisse kapasitesi (aynı mod / kg / fiyat)
/*
WITH demand AS (
  SELECT
    sa.pricing_mode,
    sa.share_weight,
    sa.share_price,
    COUNT(*)::int AS need
  FROM public.shareholders sh
  JOIN public.sacrifice_animals sa ON sa.sacrifice_id = sh.sacrifice_id
  WHERE sh.tenant_id = '00000000-0000-0000-0000-000000000003'::uuid
    AND sh.sacrifice_year = 2026
    AND sa.sacrifice_no BETWEEN 1 AND 120
  GROUP BY 1, 2, 3
),
supply AS (
  SELECT
    sa.pricing_mode,
    sa.share_weight,
    sa.share_price,
    SUM(sa.empty_share)::bigint AS slots
  FROM public.sacrifice_animals sa
  WHERE sa.tenant_id = '00000000-0000-0000-0000-000000000003'::uuid
    AND sa.sacrifice_year = 2026
    AND sa.sacrifice_no BETWEEN 1001 AND 1180
  GROUP BY 1, 2, 3
)
SELECT
  d.pricing_mode,
  d.share_weight,
  d.share_price,
  d.need,
  COALESCE(s.slots, 0) AS available_slots,
  CASE WHEN COALESCE(s.slots, 0) >= d.need THEN 'OK' ELSE 'YETERSİZ' END AS durum
FROM demand d
LEFT JOIN supply s
  ON s.pricing_mode = d.pricing_mode
 AND (s.share_weight IS NOT DISTINCT FROM d.share_weight)
 AND (s.share_price IS NOT DISTINCT FROM d.share_price)
ORDER BY d.pricing_mode, d.share_weight NULLS LAST;
*/

-- Taşınacak hissedar listesi (özet)
/*
SELECT
  sh.shareholder_id,
  sa.sacrifice_no AS kaynak_no,
  sa.pricing_mode,
  sa.share_weight,
  sa.share_price
FROM public.shareholders sh
JOIN public.sacrifice_animals sa ON sa.sacrifice_id = sh.sacrifice_id
WHERE sh.tenant_id = '00000000-0000-0000-0000-000000000003'::uuid
  AND sh.sacrifice_year = 2026
  AND sa.sacrifice_no BETWEEN 1 AND 120
ORDER BY sh.purchase_time ASC NULLS LAST, sh.shareholder_id;
*/

-- ============================================================================
-- TAŞIMA (tek transaction)
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
  v_target uuid;
  v_tenant uuid := '00000000-0000-0000-0000-000000000003';
  v_year int := 2026;
  v_tgt_min int := 1001;
  v_tgt_max int := 1180;
  v_actor text := 'SQL Elya 2026 relocate 1–120 → 1001+';
  v_row public.shareholders;
  v_to_no int;
  v_ok int := 0;
  v_skip int := 0;
BEGIN
  FOR rec IN
    SELECT
      sh.shareholder_id,
      sa.sacrifice_no AS src_no,
      sa.pricing_mode,
      sa.share_weight,
      sa.share_price
    FROM public.shareholders sh
    INNER JOIN public.sacrifice_animals sa ON sa.sacrifice_id = sh.sacrifice_id
    WHERE sh.tenant_id = v_tenant
      AND sh.sacrifice_year = v_year
      AND sa.sacrifice_no BETWEEN 1 AND 120
    ORDER BY sh.purchase_time ASC NULLS LAST, sh.shareholder_id
  LOOP
    v_target := NULL;

    IF rec.pricing_mode = 'fixed' THEN
      SELECT sa.sacrifice_id INTO v_target
      FROM public.sacrifice_animals sa
      WHERE sa.tenant_id = v_tenant
        AND sa.sacrifice_year = v_year
        AND sa.sacrifice_no BETWEEN v_tgt_min AND v_tgt_max
        AND sa.pricing_mode = 'fixed'
        AND sa.share_weight = rec.share_weight
        AND sa.share_price = rec.share_price
        AND sa.empty_share > 0
      ORDER BY sa.sacrifice_no
      LIMIT 1
      FOR UPDATE OF sa SKIP LOCKED;

    ELSIF rec.pricing_mode = 'live_scale' THEN
      SELECT sa.sacrifice_id INTO v_target
      FROM public.sacrifice_animals sa
      WHERE sa.tenant_id = v_tenant
        AND sa.sacrifice_year = v_year
        AND sa.sacrifice_no BETWEEN v_tgt_min AND v_tgt_max
        AND sa.pricing_mode = 'live_scale'
        AND sa.empty_share > 0
      ORDER BY sa.sacrifice_no
      LIMIT 1
      FOR UPDATE OF sa SKIP LOCKED;
    ELSE
      RAISE NOTICE '[ATLA] Bilinmeyen pricing_mode: shareholder_id=% %', rec.shareholder_id, rec.pricing_mode;
      v_skip := v_skip + 1;
      CONTINUE;
    END IF;

    IF v_target IS NULL THEN
      RAISE NOTICE '[ATLA] Hedef yok (boş hisse yok veya eşleşme yok): shareholder_id=% kaynak_no=% mode=% weight=%',
        rec.shareholder_id, rec.src_no, rec.pricing_mode, rec.share_weight;
      v_skip := v_skip + 1;
      CONTINUE;
    END IF;

    SELECT sa.sacrifice_no INTO v_to_no
    FROM public.sacrifice_animals sa
    WHERE sa.sacrifice_id = v_target;

    BEGIN
      SELECT * INTO v_row
      FROM public.rpc_move_shareholder_to_sacrifice(
        v_actor,
        v_tenant,
        rec.shareholder_id,
        v_target
      )
      LIMIT 1;

      v_ok := v_ok + 1;
      RAISE NOTICE '[OK] shareholder_id=% %→% (kurban_no)', rec.shareholder_id, rec.src_no, v_to_no;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '[HATA] shareholder_id=%: %', rec.shareholder_id, SQLERRM;
        v_skip := v_skip + 1;
    END;
  END LOOP;

  RAISE NOTICE 'Bitti. Başarılı taşıma: %, atlanan/hata: %', v_ok, v_skip;
END;
$$;
