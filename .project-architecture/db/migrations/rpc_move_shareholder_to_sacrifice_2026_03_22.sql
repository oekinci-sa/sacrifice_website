-- rpc_move_shareholder_to_sacrifice + log_shareholder_changes (Bağlı Kurbanlık)

-- rpc_move_shareholder_to_sacrifice: hissedarı başka kurbanlığa taşır (tek transaction, app.actor).
-- Kaynakta empty_share +1, hedefte -1; total_amount / remaining_payment yeni hisse bedeline göre.
-- İki kurbanlık satırı UUID sırasıyla FOR UPDATE (deadlock önlemi).

CREATE OR REPLACE FUNCTION public.rpc_move_shareholder_to_sacrifice(
  p_actor text,
  p_tenant_id uuid,
  p_shareholder_id uuid,
  p_target_sacrifice_id uuid
)
RETURNS public.shareholders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_sh public.shareholders;
  v_src public.sacrifice_animals;
  v_tgt public.sacrifice_animals;
  v_id_low uuid;
  v_id_high uuid;
  v_new_total numeric;
  v_new_remaining numeric;
  v_paid numeric;
  v_fee numeric;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'actor_required';
  END IF;

  PERFORM set_config('app.actor', p_actor, true);

  SELECT * INTO v_sh
  FROM public.shareholders sh
  WHERE sh.shareholder_id = p_shareholder_id
    AND sh.tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shareholder_not_found';
  END IF;

  IF v_sh.sacrifice_id = p_target_sacrifice_id THEN
    RETURN v_sh;
  END IF;

  v_id_low := LEAST(v_sh.sacrifice_id, p_target_sacrifice_id);
  v_id_high := GREATEST(v_sh.sacrifice_id, p_target_sacrifice_id);

  PERFORM 1 FROM public.sacrifice_animals WHERE sacrifice_id = v_id_low FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'sacrifice_row_missing';
  END IF;

  PERFORM 1 FROM public.sacrifice_animals WHERE sacrifice_id = v_id_high FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'sacrifice_row_missing';
  END IF;

  SELECT * INTO v_src FROM public.sacrifice_animals WHERE sacrifice_id = v_sh.sacrifice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'source_sacrifice_not_found';
  END IF;

  SELECT * INTO v_tgt FROM public.sacrifice_animals WHERE sacrifice_id = p_target_sacrifice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'target_sacrifice_not_found';
  END IF;

  IF v_src.tenant_id <> p_tenant_id OR v_tgt.tenant_id <> p_tenant_id THEN
    RAISE EXCEPTION 'tenant_mismatch';
  END IF;

  IF v_src.sacrifice_year IS DISTINCT FROM v_tgt.sacrifice_year THEN
    RAISE EXCEPTION 'sacrifice_year_mismatch';
  END IF;

  IF v_tgt.empty_share < 1 THEN
    RAISE EXCEPTION 'target_sacrifice_full';
  END IF;

  IF v_src.empty_share >= 7 THEN
    RAISE EXCEPTION 'source_empty_share_invariant';
  END IF;

  v_paid := COALESCE(v_sh.paid_amount, 0);
  v_fee := COALESCE(v_sh.delivery_fee, 0);
  v_new_total := v_tgt.share_price + v_fee;
  v_new_remaining := GREATEST(v_new_total - v_paid, 0);

  UPDATE public.sacrifice_animals sa
  SET
    empty_share = sa.empty_share + 1,
    last_edited_by = p_actor,
    last_edited_time = now()
  WHERE sa.sacrifice_id = v_src.sacrifice_id;

  UPDATE public.sacrifice_animals sa
  SET
    empty_share = sa.empty_share - 1,
    last_edited_by = p_actor,
    last_edited_time = now()
  WHERE sa.sacrifice_id = v_tgt.sacrifice_id;

  UPDATE public.shareholders sh
  SET
    sacrifice_id = v_tgt.sacrifice_id,
    sacrifice_year = v_tgt.sacrifice_year,
    total_amount = v_new_total,
    remaining_payment = v_new_remaining,
    last_edited_by = p_actor,
    last_edited_time = now()
  WHERE sh.shareholder_id = p_shareholder_id
    AND sh.tenant_id = p_tenant_id
  RETURNING * INTO v_sh;

  RETURN v_sh;
END;
$f$;

REVOKE ALL ON FUNCTION public.rpc_move_shareholder_to_sacrifice(text, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_move_shareholder_to_sacrifice(text, uuid, uuid, uuid) TO service_role;
\n\n-- shareholders → change_logs; change_owner = app.actor (RPC) veya last_edited_by
-- Açıklamalar: admin panelinde okunabilir Türkçe özetler

CREATE OR REPLACE FUNCTION public.log_shareholder_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $BODY$
DECLARE
  v_sacrifice_year INT2;
  v_sacrifice_no INT2;
  v_old_sac_no INT2;
  v_new_sac_no INT2;
  v_owner text;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    SELECT sa.sacrifice_year, sa.sacrifice_no
    INTO v_sacrifice_year, v_sacrifice_no
    FROM sacrifice_animals sa
    WHERE sa.sacrifice_id = NEW.sacrifice_id;
  ELSE
    SELECT sa.sacrifice_year, sa.sacrifice_no
    INTO v_sacrifice_year, v_sacrifice_no
    FROM sacrifice_animals sa
    WHERE sa.sacrifice_id = OLD.sacrifice_id;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'Hissedarlar',
      CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'),
      'Ekleme',
      'Yeni hissedar kaydı açıldı: «' || NEW.shareholder_name || '». Bağlı kurbanlık sıra no: ' || COALESCE(v_sacrifice_no::text, '—') || '.',
      v_owner,
      NEW.tenant_id,
      v_sacrifice_year
    );
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      NEW.last_edited_by
    );

    IF NEW.shareholder_name IS DISTINCT FROM OLD.shareholder_name THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Hissedar Adı',
        OLD.shareholder_name, NEW.shareholder_name, 'Güncelleme',
        'Hissedar görünen adı değişti: «' || COALESCE(OLD.shareholder_name, '—') || '» → «' || COALESCE(NEW.shareholder_name, '—') || '». Kurban sıra: ' || COALESCE(v_sacrifice_no::text, '—') || '.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.phone_number IS DISTINCT FROM OLD.phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Telefon Numarası',
        OLD.phone_number, NEW.phone_number, 'Güncelleme',
        'Birinci telefon güncellendi. Önce: ' || COALESCE(OLD.phone_number, 'yok') || ', şimdi: ' || COALESCE(NEW.phone_number, 'yok') || '.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.second_phone_number IS DISTINCT FROM OLD.second_phone_number THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'İkinci Telefon',
        OLD.second_phone_number, NEW.second_phone_number, 'Güncelleme',
        'İkinci / yedek telefon güncellendi. Önce: ' || COALESCE(OLD.second_phone_number, 'yok') || ', şimdi: ' || COALESCE(NEW.second_phone_number, 'yok') || '.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Toplam Tutar',
        CAST(OLD.total_amount AS TEXT), CAST(NEW.total_amount AS TEXT), 'Güncelleme',
        'Hissiye düşen toplam tutar (hisse + teslimat) değişti: ' || COALESCE(OLD.total_amount::text, '—') || ' ₺ → ' || COALESCE(NEW.total_amount::text, '—') || ' ₺.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.paid_amount IS DISTINCT FROM OLD.paid_amount THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Ödenen Tutar',
        CAST(OLD.paid_amount AS TEXT), CAST(NEW.paid_amount AS TEXT), 'Güncelleme',
        'Ödenen tutar güncellendi: ' || COALESCE(OLD.paid_amount::text, '0') || ' ₺ → ' || COALESCE(NEW.paid_amount::text, '0') || ' ₺.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.remaining_payment IS DISTINCT FROM OLD.remaining_payment THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Kalan Ödeme',
        CAST(OLD.remaining_payment AS TEXT), CAST(NEW.remaining_payment AS TEXT), 'Güncelleme',
        'Kalan ödeme tutarı: ' || COALESCE(OLD.remaining_payment::text, '—') || ' ₺ → ' || COALESCE(NEW.remaining_payment::text, '—') || ' ₺.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Teslimat Ücreti',
        CAST(OLD.delivery_fee AS TEXT), CAST(NEW.delivery_fee AS TEXT), 'Güncelleme',
        'Teslimat ücreti: ' || COALESCE(OLD.delivery_fee::text, '—') || ' ₺ → ' || COALESCE(NEW.delivery_fee::text, '—') || ' ₺.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_location IS DISTINCT FROM OLD.delivery_location THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Teslimat Noktası',
        OLD.delivery_location, NEW.delivery_location, 'Güncelleme',
        'Teslimat adresi veya noktası değişti: «' || COALESCE(OLD.delivery_location, 'belirtilmemiş') || '» → «' || COALESCE(NEW.delivery_location, 'belirtilmemiş') || '».',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.delivery_type IS DISTINCT FROM OLD.delivery_type THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Teslimat Tipi',
        OLD.delivery_type, NEW.delivery_type, 'Güncelleme',
        'Teslimat şekli güncellendi (kesimhane / adrese / vb.): «' || COALESCE(OLD.delivery_type, '—') || '» → «' || COALESCE(NEW.delivery_type, '—') || '».',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_consent IS DISTINCT FROM OLD.sacrifice_consent THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Vekalet',
        CAST(OLD.sacrifice_consent AS TEXT), CAST(NEW.sacrifice_consent AS TEXT), 'Güncelleme',
        'Kurban vekaleti / onay kaydı güncellendi: ' || CASE WHEN OLD.sacrifice_consent THEN 'onaylıydı' ELSE 'onaysızdı' END || ' → ' || CASE WHEN NEW.sacrifice_consent THEN 'onaylı' ELSE 'onaysız' END || '.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.notes IS DISTINCT FROM OLD.notes THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Notlar',
        OLD.notes, NEW.notes, 'Güncelleme',
        'Bu hissedar için not metni değiştirildi (detay eski/yeni sütunlarda).',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'E-posta',
        OLD.email, NEW.email, 'Güncelleme',
        'Hissedar e-posta adresi güncellendi: ' || COALESCE(OLD.email, 'yok') || ' → ' || COALESCE(NEW.email, 'yok') || '.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.security_code IS DISTINCT FROM OLD.security_code THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Güvenlik Kodu',
        OLD.security_code, NEW.security_code, 'Güncelleme',
        'Hisse sorgulamada kullanılan 6 haneli güvenlik kodu yenilendi (eski ve yeni değer kayıtta).',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.contacted_at IS DISTINCT FROM OLD.contacted_at THEN
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Görüşüldü',
        CAST(OLD.contacted_at AS TEXT), CAST(NEW.contacted_at AS TEXT), 'Güncelleme',
        '«Görüşüldü» işareti veya görüşme tarihi güncellendi; arama takibinde kullanılır.',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    IF NEW.sacrifice_id IS DISTINCT FROM OLD.sacrifice_id
       OR NEW.sacrifice_year IS DISTINCT FROM OLD.sacrifice_year THEN
      SELECT sa.sacrifice_no INTO v_old_sac_no FROM sacrifice_animals sa WHERE sa.sacrifice_id = OLD.sacrifice_id;
      SELECT sa.sacrifice_no INTO v_new_sac_no FROM sacrifice_animals sa WHERE sa.sacrifice_id = NEW.sacrifice_id;
      INSERT INTO change_logs (table_name, row_id, column_name, old_value, new_value, change_type, description, change_owner, tenant_id, sacrifice_year)
      VALUES (
        'Hissedarlar', CONCAT(NEW.shareholder_name, ' (', NEW.sacrifice_id, ')'), 'Bağlı Kurbanlık',
        COALESCE(v_old_sac_no::text, '—'), COALESCE(v_new_sac_no::text, '—'), 'Güncelleme',
        'Hissedar başka kurbanlığa taşındı: kurban sıra no ' || COALESCE(v_old_sac_no::text, '—') || ' → ' || COALESCE(v_new_sac_no::text, '—') || ' (boş hisse ve tutarlar güncellendi).',
        v_owner, NEW.tenant_id, v_sacrifice_year
      );
    END IF;

    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    v_owner := COALESCE(
      NULLIF(trim(COALESCE(current_setting('app.actor', true), '')), ''),
      OLD.last_edited_by
    );
    INSERT INTO change_logs (table_name, row_id, change_type, description, change_owner, tenant_id, sacrifice_year)
    VALUES (
      'Hissedarlar',
      CONCAT(OLD.shareholder_name, ' (', OLD.sacrifice_id, ')'),
      'Silme',
      'Hissedar kaydı silindi veya kurbanlıkla birlikte kaldırıldı: «' || OLD.shareholder_name || '». Kurban sıra no: ' || COALESCE(v_sacrifice_no::text, '—') || '.',
      v_owner,
      OLD.tenant_id,
      v_sacrifice_year
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$BODY$;

DROP TRIGGER IF EXISTS trigger_shareholder_changes ON public.shareholders;

CREATE TRIGGER trigger_shareholder_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.shareholders
  FOR EACH ROW
  EXECUTE FUNCTION log_shareholder_changes();
