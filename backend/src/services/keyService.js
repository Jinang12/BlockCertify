const crypto = require('crypto');
const prisma = require('../lib/prisma');

const DEFAULT_KEY_TYPE = 'ed25519';

function generateKeyMaterial() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync(DEFAULT_KEY_TYPE);
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const privateKeyDer = privateKey.export({ type: 'pkcs8', format: 'der' });
  const privateKeySeed = privateKeyDer.slice(-32).toString('base64');

  return {
    publicKeyPem,
    privateKeySeed,
    keyType: DEFAULT_KEY_TYPE,
  };
}

async function markExistingKeysRotated(tx, issuerId) {
  await tx.issuerKey.updateMany({
    where: { issuerId, rotated: false },
    data: { rotated: true },
  });
}

async function setIssuerCurrentKey(issuerId, publicKeyPem, keyType = DEFAULT_KEY_TYPE, reason = null) {
  if (!issuerId || !publicKeyPem) return null;

  return prisma.$transaction(async (tx) => {
    await markExistingKeysRotated(tx, issuerId);
    return tx.issuerKey.create({
      data: {
        issuerId,
        publicKey: publicKeyPem,
        keyType,
        reason,
      },
    });
  });
}

async function rotateIssuerKey(issuerId, reason = null) {
  if (!issuerId) {
    throw new Error('issuerId is required to rotate keys');
  }

  return prisma.$transaction(async (tx) => {
    await markExistingKeysRotated(tx, issuerId);
    const { publicKeyPem, privateKeySeed, keyType } = generateKeyMaterial();
    const key = await tx.issuerKey.create({
      data: {
        issuerId,
        publicKey: publicKeyPem,
        keyType,
        reason,
      },
    });

    console.info('KEY_ROTATED', { issuerId, keyId: key.id });

    return { privateKey: privateKeySeed, key };
  });
}

function getCurrentIssuerKey(issuerId) {
  if (!issuerId) return null;
  return prisma.issuerKey.findFirst({
    where: { issuerId, rotated: false },
    orderBy: { createdAt: 'desc' },
  });
}

function getKeyById(keyId) {
  if (!keyId) return null;
  return prisma.issuerKey.findUnique({ where: { id: keyId } });
}

function getKeyValidAt(issuerId, isoDate) {
  if (!issuerId) return null;
  const date = isoDate ? new Date(isoDate) : null;
  const where = { issuerId };
  if (date && !Number.isNaN(date.getTime())) {
    where.createdAt = { lte: date };
  }

  return prisma.issuerKey.findFirst({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  generateKeyMaterial,
  rotateIssuerKey,
  getCurrentIssuerKey,
  getKeyById,
  getKeyValidAt,
  setIssuerCurrentKey,
};
