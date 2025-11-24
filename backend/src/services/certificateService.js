const prisma = require('../lib/prisma');
const crypto = require('crypto');

/**
 * Append a new certificate record to the ledger
 * @param {Object} params - Certificate data
 * @returns {Promise<Object>} The created certificate record
 */
function coerceIssuedAt(issuedOn) {
  if (!issuedOn) {
    return new Date();
  }

  const directDate = issuedOn instanceof Date ? issuedOn : new Date(issuedOn);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const match = typeof issuedOn === 'string' && issuedOn.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const isoLike = `${year}-${month}-${day}T00:00:00Z`;
    const parsed = new Date(isoLike);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

async function appendCertificateRecord({
  certificateId,
  issuerCompanyId,
  issuerKeyId,
  issuerPublicKey,
  issuerKeyType = 'ed25519',
  signature,
  hash,
  pdfHash = null,
  verificationUrl,
  certificate,
  issuedOn,
}) {
  const certificateJson = typeof certificate === 'string' ? JSON.parse(certificate) : certificate;
  const issuedAt = coerceIssuedAt(issuedOn || certificateJson?.issuedOn);

  const result = await prisma.$transaction(async (tx) => {
    // Create the certificate record
    const cert = await tx.certificate.create({
      data: {
        certificateId,
        issuerId: issuerCompanyId,
        issuerKeyId,
        certificateJson,
        canonicalHash: hash,
        pdfHash,
        signature,
        status: 'VALID', // Default status for new certificates
        issuedAt,
        verificationUrl,
      },
    });

    // Create the initial ISSUED event
    await tx.certificateEvent.create({
      data: {
        certificateId: cert.id,
        issuerId: issuerCompanyId,
        eventType: 'ISSUED',
        payload: { 
          issuerPublicKey,
          issuerKeyType,
          issuerKeyId,
          verificationUrl,
        },
        eventHash: crypto.createHash('sha256')
          .update(`${cert.id}:ISSUED:${Date.now()}`)
          .digest('hex'),
      },
    });

    return cert;
  });

  return {
    ...result,
    issuerCompanyId: result.issuerId,
    issuerKeyId: result.issuerKeyId || issuerKeyId,
    issuerPublicKey,
    issuerKeyType,
    hash: result.canonicalHash,
  };
}

/**
 * List all certificates for a specific company
 * @param {string} companyId - The ID of the company
 * @returns {Promise<Array>} Array of certificate records
 */
async function listCertificatesByCompany(companyId) {
  if (!companyId) return [];
  
  const certificates = await prisma.certificate.findMany({
    where: { 
      issuerId: companyId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    include: buildCertificateInclude(),
  });

  return certificates.map(mapCertificateRecord);
}

/**
 * Find a certificate by its ID
 * @param {string} certificateId - The ID of the certificate to find
 * @returns {Promise<Object|null>} The certificate record or null if not found
 */
function buildCertificateInclude() {
  return {
    issuer: {
      select: {
        id: true,
        issuerKeys: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    },
    issuerKey: true,
  };
}

function mapCertificateRecord(cert) {
  if (!cert) return null;
  const fallbackKey = cert.issuer?.issuerKeys?.[0];
  const key = cert.issuerKey || fallbackKey || null;
  return {
    id: cert.id,
    certificateId: cert.certificateId,
    issuerId: cert.issuerId,
    issuerCompanyId: cert.issuerId,
    issuerKeyId: cert.issuerKeyId || key?.id || null,
    issuerPublicKey: key?.publicKey || null,
    issuerKeyType: key?.keyType || 'ed25519',
    certificateJson: cert.certificateJson,
    certificate: cert.certificateJson,
    canonicalHash: cert.canonicalHash,
    hash: cert.canonicalHash,
    pdfHash: cert.pdfHash,
    signature: cert.signature,
    status: cert.status,
    issuedAt: cert.issuedAt,
    revokedAt: cert.revokedAt,
    revocationReason: cert.revocationReason,
    verificationUrl: cert.verificationUrl,
    createdAt: cert.createdAt,
    updatedAt: cert.updatedAt,
  };
}

async function findCertificateById(certificateId) {
  if (!certificateId) return null;
  
  const cert = await prisma.certificate.findFirst({
    where: { 
      certificateId,
      deletedAt: null,
    },
    include: buildCertificateInclude(),
  });

  return mapCertificateRecord(cert);
}

/**
 * Find a certificate by its hash
 * @param {string} hash - The hash of the certificate to find
 * @returns {Promise<Object|null>} The certificate record or null if not found
 */
async function findCertificateByHash(hash) {
  if (!hash) return null;
  
  const cert = await prisma.certificate.findFirst({
    where: { 
      canonicalHash: hash,
      deletedAt: null,
    },
    include: buildCertificateInclude(),
  });

  return mapCertificateRecord(cert);
}

/**
 * Find a certificate by its PDF hash
 * @param {string} pdfHash - The PDF hash of the certificate to find
 * @returns {Promise<Object|null>} The certificate record or null if not found
 */
async function findCertificateByPdfHash(pdfHash) {
  if (!pdfHash) return null;
  
  const cert = await prisma.certificate.findFirst({
    where: { 
      pdfHash,
      deletedAt: null,
    },
    include: buildCertificateInclude(),
  });

  return mapCertificateRecord(cert);
}

/**
 * Update the status of a certificate
 * @param {string} certificateId - The ID of the certificate to update
 * @param {string} status - The new status ('VALID', 'REVOKED', 'EXPIRED')
 * @param {Object} options - Additional options
 * @param {string} [options.reason] - Reason for revocation
 * @param {Date|string} [options.expiredAt] - Expiration date
 * @returns {Promise<Object>} The updated certificate record
 */
async function updateCertificateStatus(certificateId, status, { reason = null, expiredAt = null } = {}) {
  if (!certificateId) throw new Error('certificateId is required');
  if (!['VALID', 'REVOKED', 'EXPIRED'].includes(status)) {
    throw new Error('Invalid status. Must be one of: VALID, REVOKED, EXPIRED');
  }

  const existing = await prisma.certificate.findFirst({
    where: { certificateId, deletedAt: null },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error('Certificate not found');
  }

  const updateData = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'REVOKED') {
    updateData.revokedAt = new Date();
    updateData.revocationReason = reason || null;
  } else if (status === 'EXPIRED') {
    updateData.expiredAt = expiredAt ? new Date(expiredAt) : new Date();
  }

  const cert = await prisma.certificate.update({
    where: { id: existing.id },
    data: updateData,
    include: buildCertificateInclude(),
  });

  const record = mapCertificateRecord(cert);
  
  // Create a status change event
  await prisma.certificateEvent.create({
    data: {
      certificateId: cert.id,
      issuerId: cert.issuerId,
      eventType: `${status}`,
      payload: status === 'REVOKED' ? { reason } : { expiredAt },
      eventHash: crypto.createHash('sha256')
        .update(`${cert.id}:${status}:${Date.now()}`)
        .digest('hex'),
    },
  });

  return record;
}

/**
 * List all certificates (for admin purposes)
 * @returns {Promise<Array>} Array of all certificate records
 */
async function listCertificates() {
  const certificates = await prisma.certificate.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: buildCertificateInclude(),
  });

  return certificates.map(mapCertificateRecord);
}

module.exports = {
  appendCertificateRecord,
  listCertificates,
  listCertificatesByCompany,
  findCertificateById,
  findCertificateByHash,
  findCertificateByPdfHash,
  updateCertificateStatus,
};
