-- Test tenant otomatik SMS şablonlarını tüm tenant'lara kopyala ve aktifleştir
-- Kaynak tenant: 00000000-0000-0000-0000-000000000001 (Test Derneği)
-- 2026-05-26 operasyonel senkron

UPDATE tenant_settings SET sms_auto_enabled = true;

UPDATE sms_templates
SET is_active = true, updated_at = now()
WHERE event_key IN (
  'slaughter_approaching', 'slaughter_imminent', 'slaughter_completed',
  'butcher_started', 'delivery_completed', 'delivery_pickup_approaching',
  'payment_amount_updated'
);

UPDATE sms_templates dst
SET
  title = src.title,
  description = src.description,
  category = src.category,
  content = src.content,
  content_external = src.content_external,
  variables = src.variables,
  is_active = true,
  updated_at = now()
FROM sms_templates src
WHERE src.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND src.event_key IS NOT NULL
  AND src.event_key IN (
    'slaughter_approaching', 'slaughter_imminent', 'slaughter_completed',
    'butcher_started', 'delivery_completed', 'delivery_pickup_approaching',
    'payment_amount_updated'
  )
  AND dst.tenant_id != src.tenant_id
  AND dst.event_key = src.event_key;

INSERT INTO sms_templates (
  tenant_id, title, description, category, content, content_external,
  variables, is_active, event_key, created_by
)
SELECT
  t.id,
  src.title,
  src.description,
  src.category,
  src.content,
  src.content_external,
  src.variables,
  true,
  src.event_key,
  'system-sync'
FROM tenants t
CROSS JOIN sms_templates src
WHERE src.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND src.event_key IS NOT NULL
  AND src.event_key IN (
    'slaughter_approaching', 'slaughter_imminent', 'slaughter_completed',
    'butcher_started', 'delivery_completed', 'delivery_pickup_approaching',
    'payment_amount_updated'
  )
  AND t.id != src.tenant_id
  AND NOT EXISTS (
    SELECT 1 FROM sms_templates ex
    WHERE ex.tenant_id = t.id AND ex.event_key = src.event_key
  );

INSERT INTO sms_auto_event_settings (
  tenant_id, event_key, target_offset, recipient_scope,
  skip_if_target_missing, skip_if_target_completed
)
SELECT
  t.id,
  src.event_key,
  src.target_offset,
  src.recipient_scope,
  src.skip_if_target_missing,
  src.skip_if_target_completed
FROM tenants t
CROSS JOIN sms_auto_event_settings src
WHERE src.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND t.id != src.tenant_id
  AND NOT EXISTS (
    SELECT 1 FROM sms_auto_event_settings ex
    WHERE ex.tenant_id = t.id AND ex.event_key = src.event_key
  );

UPDATE sms_auto_event_settings dst
SET
  target_offset = src.target_offset,
  recipient_scope = src.recipient_scope,
  skip_if_target_missing = src.skip_if_target_missing,
  skip_if_target_completed = src.skip_if_target_completed,
  updated_at = now()
FROM sms_auto_event_settings src
WHERE src.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND dst.tenant_id != src.tenant_id
  AND dst.event_key = src.event_key;
