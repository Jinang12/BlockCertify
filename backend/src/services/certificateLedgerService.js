const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const ledgerPath = path.join(dataDir, 'certificateLedger.json');
const defaultLedger = { entries: [] };

function ensureLedger() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(ledgerPath)) {
    fs.writeFileSync(ledgerPath, JSON.stringify(defaultLedger, null, 2));
  }
}

function readLedger() {
  ensureLedger();
  const raw = fs.readFileSync(ledgerPath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Ledger corrupt. Reinitializing.');
    fs.writeFileSync(ledgerPath, JSON.stringify(defaultLedger, null, 2));
    return { ...defaultLedger };
  }
}

function saveLedger(ledger) {
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
}

function appendCertificateRecord(record) {
  const ledger = readLedger();
  const entry = {
    status: 'VALID',
    revokedAt: null,
    revocationReason: null,
    expiredAt: null,
    ...record,
  };
  if (!entry.issuerKeyType) {
    entry.issuerKeyType = 'ed25519';
  }
  ledger.entries.push(entry);
  saveLedger(ledger);
  return entry;
}

function listCertificates() {
  const ledger = readLedger();
  return ledger.entries;
}

function listCertificatesByCompany(companyId) {
  if (!companyId) return [];
  return listCertificates().filter((entry) => entry.issuerCompanyId === companyId);
}

function findCertificateById(certificateId) {
  if (!certificateId) return null;
  return listCertificates().find((entry) => entry.certificateId === certificateId);
}

function findCertificateByHash(hash) {
  if (!hash) return null;
  return listCertificates().find((entry) => entry.hash === hash);
}

function findCertificateByPdfHash(pdfHash) {
  if (!pdfHash) return null;
  return listCertificates().find((entry) => entry.pdfHash === pdfHash);
}

function updateCertificateStatus(certificateId, status, { reason = null, expiredAt = null } = {}) {
  const ledger = readLedger();
  const entry = ledger.entries.find((item) => item.certificateId === certificateId);
  if (!entry) {
    return null;
  }

  entry.status = status;
  if (status === 'REVOKED') {
    entry.revokedAt = new Date().toISOString();
    entry.revocationReason = reason || null;
  }

  if (status === 'EXPIRED') {
    entry.expiredAt = expiredAt || new Date().toISOString();
  }

  saveLedger(ledger);
  return entry;
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
