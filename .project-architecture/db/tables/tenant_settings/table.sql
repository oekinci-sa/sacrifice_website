CREATE TABLE tenant_settings (
  tenant_id       UUID PRIMARY KEY REFERENCES tenants(id),
  theme_json      JSONB DEFAULT '{}'::jsonb,
  homepage_mode   TEXT DEFAULT 'pre_campaign' CHECK (homepage_mode IN ('pre_campaign', 'launch_countdown', 'live', 'thanks', 'follow_up', 'anasayfa', 'takip')),
  logo_slug       TEXT DEFAULT 'ankara-kurban',
  iban            TEXT,
  website_url     TEXT,
  contact_phone   TEXT,
  contact_email   TEXT,
  contact_address TEXT,
  active_sacrifice_year SMALLINT DEFAULT 2025,
  deposit_amount NUMERIC(12,2) DEFAULT 10000,
  deposit_deadline_days SMALLINT DEFAULT 3,
  full_payment_deadline_month SMALLINT DEFAULT 5,
  full_payment_deadline_day SMALLINT DEFAULT 20,
  agreement_terms JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
