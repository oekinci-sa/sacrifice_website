CREATE TABLE tenant_settings (
  tenant_id       UUID PRIMARY KEY REFERENCES tenants(id),
  theme_json      JSONB DEFAULT '{}'::jsonb,
  homepage_mode   TEXT DEFAULT 'thanks' CHECK (homepage_mode IN ('anasayfa', 'thanks', 'takip')),
  homepage_layout TEXT DEFAULT 'default' CHECK (homepage_layout IN ('default', 'golbasi', 'kahramankazan')),
  logo_slug       TEXT DEFAULT 'ankara-kurban',
  iban            TEXT,
  website_url     TEXT,
  contact_phone   TEXT,
  contact_email   TEXT,
  contact_address TEXT,
  active_sacrifice_year SMALLINT DEFAULT 2025,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
