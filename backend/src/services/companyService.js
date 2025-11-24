const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { setIssuerCurrentKey, getCurrentIssuerKey } = require('./keyService');

const DEFAULT_KEY_TYPE = 'ed25519';

function normalizeEmail(email) {
  return email ? email.trim().toLowerCase() : null;
}

function normalizeDomain(domain) {
  return domain ? domain.trim().toLowerCase() : null;
}

function mapIssuerToCompany(issuer, authUser, activeKey) {
  if (!issuer) {
    return null;
  }

  return {
    companyId: issuer.id,
    companyName: issuer.legalName,
    domain: issuer.domain,
    email: authUser?.email || issuer.contactEmail,
    contactEmail: issuer.contactEmail,
    verified: issuer.status === 'VERIFIED',
    status: issuer.status,
    passwordHash: authUser?.passwordHash || null,
    publicKeyPem: activeKey?.publicKey || null,
    keyType: activeKey?.keyType || DEFAULT_KEY_TYPE,
    issuerKeyId: activeKey?.id || null,
  };
}

async function getActiveKey(issuerId) {
  if (!issuerId) return null;
  return getCurrentIssuerKey(issuerId);
}

function generateCompanyKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync(DEFAULT_KEY_TYPE);

  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const privateKeyDer = privateKey.export({ type: 'pkcs8', format: 'der' });
  const privateKeySeed = privateKeyDer.slice(-32).toString('base64');

  return {
    keyType: DEFAULT_KEY_TYPE,
    publicKeyPem,
    privateKeyPem,
    privateKeySeed,
  };
}

async function upsertCompany({
  companyId,
  companyName,
  domain,
  email,
  passwordHash,
  verified,
  publicKeyPem,
  keyType = DEFAULT_KEY_TYPE,
}) {
  const normalizedDomain = normalizeDomain(domain);
  const normalizedEmail = normalizeEmail(email);
  const status = verified ? 'VERIFIED' : 'PENDING';

  if (!companyName || !normalizedDomain || !normalizedEmail) {
    throw new Error('companyName, domain, and email are required');
  }

  const issuerData = {
    legalName: companyName,
    domain: normalizedDomain,
    contactEmail: normalizedEmail,
    status,
  };

  let issuer;
  if (companyId) {
    issuer = await prisma.issuer.update({
      where: { id: companyId },
      data: issuerData,
    });
  } else {
    issuer = await prisma.issuer.upsert({
      where: { domain: normalizedDomain },
      update: issuerData,
      create: issuerData,
    });
  }

  if (passwordHash) {
    await prisma.auth.upsert({
      where: {
        issuerId_email: {
          issuerId: issuer.id,
          email: normalizedEmail,
        },
      },
      update: { passwordHash },
      create: {
        issuerId: issuer.id,
        email: normalizedEmail,
        passwordHash,
      },
    });
  }

  if (publicKeyPem) {
    await setIssuerCurrentKey(issuer.id, publicKeyPem, keyType);
  }

  return getCompanyById(issuer.id);
}

async function getCompanyByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const authUser = await prisma.auth.findFirst({
    where: { email: normalizedEmail },
    include: {
      issuer: {
        include: {
          issuerKeys: {
            where: { rotated: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!authUser || !authUser.issuer) {
    return null;
  }

  const activeKey = authUser.issuer.issuerKeys[0] || null;
  return mapIssuerToCompany(authUser.issuer, authUser, activeKey);
}

async function getCompanyByDomain(domain) {
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) return null;

  const issuer = await prisma.issuer.findUnique({
    where: { domain: normalizedDomain },
    include: {
      issuerKeys: {
        where: { rotated: false },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      authUsers: {
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });

  if (!issuer) return null;
  const activeKey = issuer.issuerKeys[0] || null;
  const authUser = issuer.authUsers[0] || null;
  return mapIssuerToCompany(issuer, authUser, activeKey);
}

async function getCompanyById(companyId) {
  if (!companyId) return null;

  const issuer = await prisma.issuer.findUnique({
    where: { id: companyId },
    include: {
      issuerKeys: {
        where: { rotated: false },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      authUsers: {
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });

  if (!issuer) return null;
  const activeKey = issuer.issuerKeys[0] || null;
  const authUser = issuer.authUsers[0] || null;
  return mapIssuerToCompany(issuer, authUser, activeKey);
}

module.exports = {
  generateCompanyKeypair,
  upsertCompany,
  getCompanyByEmail,
  getCompanyByDomain,
  getCompanyById,
};
