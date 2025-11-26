const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { validateCertificate } = require('../utils/validateCertificate');
const { verifySignature, canonicalizeCertificate } = require('../utils/verifySignature');
const { encodePayload } = require('../utils/qrPayload');
const { createTemplatePdf, enhanceExistingPdf } = require('../services/pdfService');
const { extractPayloadFromPdf } = require('../services/pdfExtractor');
const {
  appendCertificateRecord,
  listCertificatesByCompany,
  findCertificateByHash,
  findCertificateByPdfHash,
  findCertificateById,
  updateCertificateStatus,
} = require('../services/certificateService');
const { getCompanyById } = require('../services/companyService');

const PUBLIC_VERIFY_URL = process.env.PUBLIC_VERIFY_URL || 'https://blockcertify.app/verify';

function parseCertificatePayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch (error) {
      return null;
    }
  }
  return payload;
}

function buildVerificationUrl(certificateId) {
  const base = PUBLIC_VERIFY_URL.endsWith('/') ? PUBLIC_VERIFY_URL.slice(0, -1) : PUBLIC_VERIFY_URL;
  return `${base}?certificateId=${encodeURIComponent(certificateId)}`;
}

async function issueCertificateAndPdf({ certificateJson, signature, company, pdfBuffer }) {
  const canonical = canonicalizeCertificate(certificateJson);
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  const payloadJson = encodePayload(certificateJson, signature);
  const verificationUrl = buildVerificationUrl(certificateJson.certificateId);

  let pdfBytes;
  if (pdfBuffer) {
    pdfBytes = await enhanceExistingPdf(pdfBuffer, {
      certificateJson,
      hash,
      verificationUrl,
      payloadJson,
    });
  } else {
    pdfBytes = await createTemplatePdf({
      certificateJson,
      hash,
      verificationUrl,
      payloadJson,
    });
  }

  const pdfHash = crypto.createHash('sha256').update(Buffer.from(pdfBytes)).digest('hex');

  const record = await appendCertificateRecord({
    certificateId: certificateJson.certificateId,
    issuerCompanyId: company.companyId,
    issuerKeyId: company.issuerKeyId || null,
    issuerPublicKey: company.publicKeyPem,
    issuerKeyType: company.keyType || 'ed25519',
    signature,
    hash,
    pdfHash,
    verificationUrl,
    certificate: certificateJson,
    issuedOn: certificateJson.issuedOn,
  });

  return {
    record,
    pdfBytes,
    hash,
  };
}

router.post('/issue/template', authMiddleware, async (req, res) => {
  try {
    const certificateJson = parseCertificatePayload(req.body.certificateJson);
    const signature = req.body.signature;

    if (!certificateJson || !signature) {
      return res.status(400).json({ error: 'certificateJson and signature are required' });
    }

    const { isValid, errors } = validateCertificate(certificateJson);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid certificate data', details: errors });
    }

    const company = req.company;
    const signatureValid = verifySignature(
      certificateJson,
      signature,
      company.publicKeyPem,
      company.keyType || 'ed25519'
    );

    if (!signatureValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { record, pdfBytes, hash } = await issueCertificateAndPdf({
      certificateJson,
      signature,
      company,
    });

    res.json({
      status: 'issued',
      hash,
      certificateId: record.certificateId,
      pdfBase64: Buffer.from(pdfBytes).toString('base64'),
      verificationUrl: record.verificationUrl,
    });
  } catch (error) {
    console.error('Template issuance error:', error);
    res.status(500).json({ error: 'Failed to issue certificate with template' });
  }
});

router.post('/issue/upload', authMiddleware, async (req, res) => {
  try {
    const certificateJson = parseCertificatePayload(req.body.certificateJson);
    const signature = req.body.signature;
    const uploadedPdf = req.files?.pdf;

    if (!certificateJson || !signature || !uploadedPdf) {
      return res.status(400).json({ error: 'certificateJson, signature, and pdf file are required' });
    }

    const { isValid, errors } = validateCertificate(certificateJson);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid certificate data', details: errors });
    }

    const company = req.company;
    const signatureValid = verifySignature(
      certificateJson,
      signature,
      company.publicKeyPem,
      company.keyType || 'ed25519'
    );

    if (!signatureValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const pdfBuffer = Buffer.isBuffer(uploadedPdf.data) ? uploadedPdf.data : Buffer.from(uploadedPdf.data);
    const { record, pdfBytes, hash } = await issueCertificateAndPdf({
      certificateJson,
      signature,
      company,
      pdfBuffer,
    });

    res.json({
      status: 'issued',
      hash,
      certificateId: record.certificateId,
      pdfBase64: Buffer.from(pdfBytes).toString('base64'),
      verificationUrl: record.verificationUrl,
    });
  } catch (error) {
    console.error('Upload issuance error:', error);
    res.status(500).json({ error: 'Failed to enhance uploaded certificate' });
  }
});

router.post('/verify/pdf', async (req, res) => {
  try {
    const pdfFile = req.files?.pdf;
    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const buffer = Buffer.isBuffer(pdfFile.data) ? pdfFile.data : Buffer.from(pdfFile.data);
    const pdfHash = crypto.createHash('sha256').update(buffer).digest('hex');

    let record = await findCertificateByPdfHash(pdfHash);
    let payload;

    try {
      ({ payload } = await extractPayloadFromPdf(buffer));
    } catch (parseError) {
      console.warn('Failed to parse embedded payload from PDF bytes:', parseError?.message || parseError);
      payload = null;
    }

    let certificateJson = payload?.certificateJson || null;
    let signature = payload?.signature || null;

    if (!record && certificateJson?.certificateId) {
      record = await findCertificateById(certificateJson.certificateId);
    }

    if (!record && (!certificateJson || !signature)) {
      return res.status(400).json({ error: 'Unable to locate embedded certificate payload in PDF' });
    }

    if (record) {
      if (!certificateJson && record.certificate) {
        certificateJson = record.certificate;
      }
      if (!signature && record.signature) {
        signature = record.signature;
      }
    }

    if (!record) {
      return res.json({
        verdict: 'COUNTERFEIT',
        reason: 'Certificate not found in ledger',
      });
    }

    if (!certificateJson || !signature) {
      return res.status(400).json({ error: 'Unable to extract certificate payload for verification' });
    }

    const canonical = canonicalizeCertificate(certificateJson);
    const computedHash = crypto.createHash('sha256').update(canonical).digest('hex');
    const hashMatch = computedHash === record.hash;
    const signatureValid = verifySignature(
      certificateJson,
      signature,
      record.issuerPublicKey,
      record.issuerKeyType || 'ed25519'
    );
    const statusValid = record.status === 'VALID';
    const pdfHashMatch = !record.pdfHash || record.pdfHash === pdfHash;

    let verdict = 'AUTHENTIC';
    let reason;

    if (!hashMatch) {
      verdict = 'COUNTERFEIT';
      reason = 'Certificate payload hash mismatch';
    } else if (!signatureValid) {
      verdict = 'COUNTERFEIT';
      reason = 'Digital signature invalid';
    } else if (!statusValid) {
      verdict = 'COUNTERFEIT';
      reason = 'Ledger status is not VALID';
    } else if (!pdfHashMatch) {
      verdict = 'COUNTERFEIT';
      reason = 'PDF bytes do not match ledger hash';
    }

    res.json({
      verdict,
      reason,
      checks: {
        hashMatch,
        signatureValid,
        statusValid,
        pdfHashMatch,
      },
      ledger: {
        certificateId: record.certificateId,
        issuedOn: record.issuedOn,
        hash: record.hash,
        status: record.status,
        verificationUrl: record.verificationUrl,
        pdfHash: record.pdfHash,
      },
      certificate: certificateJson,
    });
  } catch (error) {
    console.error('PDF verification error:', error);
    res.status(500).json({ error: 'Failed to verify PDF' });
  }
});

router.post('/:certificateId/revoke', authMiddleware, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { reason } = req.body || {};

    const record = await findCertificateById(certificateId);
    if (!record) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (record.issuerCompanyId !== req.company.companyId) {
      return res.status(403).json({ error: 'Not authorized to revoke this certificate' });
    }

    if (record.status === 'REVOKED') {
      return res.json({ status: 'already_revoked', record });
    }

    const updated = await updateCertificateStatus(certificateId, 'REVOKED', { reason });
    res.json({ status: 'revoked', record: updated });
  } catch (error) {
    console.error('Revocation error:', error);
    res.status(500).json({ error: 'Failed to revoke certificate' });
  }
});

router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const entries = (await listCertificatesByCompany(req.company.companyId)).map((entry) => ({
      certificateId: entry.certificateId,
      hash: entry.hash,
      pdfHash: entry.pdfHash,
      issuedOn: entry.issuedOn,
      status: entry.status,
      revokedAt: entry.revokedAt,
      revocationReason: entry.revocationReason,
      certificate: entry.certificate,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      issuerKeyId: entry.issuerKeyId,
    }));

    res.json({ certificates: entries });
  } catch (error) {
    console.error('List certificates error:', error);
    res.status(500).json({ error: 'Failed to load certificates' });
  }
});

router.get('/mine/download', authMiddleware, async (req, res) => {
  try {
    const entries = await listCertificatesByCompany(req.company.companyId);
    const rows = [
      ['certificate_id', 'status', 'issued_on', 'revoked_at', 'revocation_reason', 'hash', 'pdf_hash'].join(','),
      ...entries.map((entry) => [
        entry.certificateId,
        entry.status,
        entry.issuedOn ? new Date(entry.issuedOn).toISOString() : '',
        entry.revokedAt ? new Date(entry.revokedAt).toISOString() : '',
        (entry.revocationReason || '').replace(/\n/g, ' '),
        entry.hash,
        entry.pdfHash || '',
      ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')),
    ];

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="blockcertify-certificates.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Certificate CSV download error:', error);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

module.exports = router;
