-- Issue certificate (must run within transaction)
-- Parameters: issuer_id, certificate_id, certificate_payload_json, canonical_hash, pdf_hash, signature, issued_at, verification_url
WITH inserted_certificate AS (
  INSERT INTO certificates (
    issuer_id,
    certificate_id,
    certificate_json,
    canonical_hash,
    pdf_hash,
    signature,
    issued_at,
    verification_url
  ) VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)
  ON CONFLICT (issuer_id, certificate_id) DO NOTHING
  RETURNING *
)
INSERT INTO certificate_events (certificate_id, issuer_id, event_type, payload)
SELECT id, issuer_id, 'ISSUED', jsonb_build_object(
  'canonical_hash', $4,
  'pdf_hash', $5,
  'signature', $6
)
FROM inserted_certificate;

-- Revoke certificate (parameters: issuer_id, certificate_id, reason)
UPDATE certificates SET
  status = 'REVOKED',
  revoked_at = now(),
  revocation_reason = $3,
  updated_at = now()
WHERE issuer_id = $1 AND certificate_id = $2;

INSERT INTO certificate_events (certificate_id, issuer_id, event_type, payload)
SELECT id, issuer_id, 'REVOKED', jsonb_build_object('reason', $3)
FROM certificates
WHERE issuer_id = $1 AND certificate_id = $2;

-- Verify certificate (parameters: canonical_hash)
SELECT c.*, ik.public_key
FROM certificates c
JOIN issuer_keys ik ON ik.issuer_id = c.issuer_id AND ik.is_active
WHERE c.canonical_hash = $1;

-- Log verification attempt (params: issuer_id, certificate_id, verdict, reason, metadata_json)
INSERT INTO verification_logs (
  issuer_id,
  certificate_id,
  verdict,
  reason,
  request_metadata
) VALUES ($1, $2, $3, $4, $5::jsonb);

-- Rotate public key safely (params: issuer_id, new_key, key_type, fingerprint)
BEGIN;
UPDATE issuer_keys SET
  is_active = false,
  rotated_at = now()
WHERE issuer_id = $1 AND is_active;

INSERT INTO issuer_keys (issuer_id, public_key, key_type, fingerprint, is_active)
VALUES ($1, $2, $3, $4, true);
COMMIT;
