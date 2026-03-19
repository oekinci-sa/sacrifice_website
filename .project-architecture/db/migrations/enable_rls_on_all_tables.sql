-- RLS zaten açık: change_logs, failed_reservation_transactions_logs, reservation_transactions,
-- sacrifice_animals, shareholders, stage_metrics
-- RLS açılacak tablolar:
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_trigger_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mismatched_share_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: anon/authenticated için bu tablolarda erişim yok (service_role bypass eder)
-- Policy eklenmezse RLS ile tüm satırlar reddedilir - bu istenen davranış
