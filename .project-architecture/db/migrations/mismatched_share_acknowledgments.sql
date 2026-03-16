-- mismatched_share_acknowledgments tablosu ve shareholders trigger

-- View güncelle (tenant_id ekle - admin filtreleme için)
CREATE OR REPLACE VIEW mismatched_shares AS
SELECT 
    s.sacrifice_id AS sacrifice_id,
    s.tenant_id AS tenant_id,
    COUNT(sh.sacrifice_id) AS shareholder_count,
    s.empty_share,
    COUNT(sh.sacrifice_id) + s.empty_share AS total_shares,
    'Hissedar sayısı ile boş hisse sayısı toplamı 7 değil! Hata boş hisse sayısı değerinde olabilir.' AS explanation
FROM sacrifice_animals s
LEFT JOIN shareholders sh ON s.sacrifice_id = sh.sacrifice_id
GROUP BY s.sacrifice_id, s.tenant_id, s.empty_share
HAVING (COUNT(sh.sacrifice_id) + s.empty_share) <> 7;

-- Tablo
CREATE TABLE IF NOT EXISTS "public"."mismatched_share_acknowledgments" (
  "sacrifice_id" UUID PRIMARY KEY REFERENCES sacrifice_animals(sacrifice_id) ON DELETE CASCADE,
  "tenant_id" UUID NOT NULL REFERENCES tenants(id),
  "acknowledged_by" TEXT NOT NULL,
  "acknowledged_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mismatched_ack_tenant ON mismatched_share_acknowledgments (tenant_id);

-- Trigger fonksiyonu ve trigger
CREATE OR REPLACE FUNCTION clear_mismatched_ack_on_new_shareholder()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM mismatched_share_acknowledgments
  WHERE sacrifice_id = NEW.sacrifice_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clear_mismatched_ack_on_new_shareholder ON shareholders;
CREATE TRIGGER trg_clear_mismatched_ack_on_new_shareholder
AFTER INSERT ON shareholders
FOR EACH ROW
EXECUTE FUNCTION clear_mismatched_ack_on_new_shareholder();
