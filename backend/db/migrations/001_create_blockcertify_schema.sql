-- PostgreSQL schema for BlockCertify
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  contact_email CITEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE issuer_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  key_type TEXT NOT NULL DEFAULT 'ed25519',
  fingerprint TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (issuer_id, is_active) WHERE is_active
);

CREATE TABLE auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  password_hash TEXT NOT NULL,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (issuer_id, email)
);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  certificate_id TEXT NOT NULL,
  certificate_json JSONB NOT NULL,
  canonical_hash TEXT NOT NULL,
  pdf_hash TEXT,
  signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'VALID',
  issued_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  verification_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (issuer_id, certificate_id)
);

CREATE INDEX idx_certificates_hash ON certificates (canonical_hash);
CREATE INDEX idx_certificates_pdf_hash ON certificates (pdf_hash);

CREATE TABLE certificate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE RESTRICT,
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('ISSUED', 'REVOKED', 'ANNOTATED')),
  payload JSONB NOT NULL,
  prev_event_hash TEXT,
  event_hash TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_certificate_events_cert ON certificate_events (certificate_id, occurred_at);

CREATE TABLE verification_logs (
  id BIGSERIAL PRIMARY KEY,
  issuer_id UUID REFERENCES issuers(id) ON DELETE SET NULL,
  certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,
  verdict TEXT NOT NULL,
  reason TEXT,
  request_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger immutability: hash chaining trigger
CREATE FUNCTION blockcertify_set_event_hash() RETURNS trigger AS $$
BEGIN
  NEW.prev_event_hash := (
    SELECT event_hash FROM certificate_events
    WHERE certificate_id = NEW.certificate_id
    ORDER BY occurred_at DESC LIMIT 1
  );

  NEW.event_hash := encode(digest(
    coalesce(NEW.prev_event_hash, '') || NEW.event_type || NEW.payload::text || NEW.occurred_at::text, 'sha256'
  ), 'hex');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_certificate_events_hash
BEFORE INSERT ON certificate_events
FOR EACH ROW EXECUTE FUNCTION blockcertify_set_event_hash();

CREATE RULE block_update_certificate_events AS
  ON UPDATE TO certificate_events DO INSTEAD NOTHING;

CREATE RULE block_delete_certificate_events AS
  ON DELETE TO certificate_events DO INSTEAD NOTHING;

-- Row level security policies
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY issuer_owns_certificates
  ON certificates FOR ALL
  USING (issuer_id = current_setting('app.current_issuer', true)::uuid);

CREATE POLICY issuer_views_events
  ON certificate_events FOR SELECT
  USING (issuer_id = current_setting('app.current_issuer', true)::uuid);

CREATE POLICY issuer_logs_verifications
  ON verification_logs FOR ALL
  USING (issuer_id = current_setting('app.current_issuer', true)::uuid)
  WITH CHECK (issuer_id = current_setting('app.current_issuer', true)::uuid);

CREATE POLICY issuer_manages_events
  ON certificate_events FOR INSERT
  WITH CHECK (issuer_id = current_setting('app.current_issuer', true)::uuid);

-- Every request should set the current issuer before executing queries
-- SELECT set_config('app.current_issuer', '<issuer_uuid>', false);
