const crypto = require('crypto');

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortValue(value[key]);
        return acc;
      }, {});
  }

  return value;
}

function canonicalizeCertificate(certificateJson) {
  return JSON.stringify(sortValue(certificateJson));
}

function verifySignature(certificateJson, signatureBase64, publicKeyPem, keyType = 'ed25519') {
  try {
    const canonical = canonicalizeCertificate(certificateJson);
    const signature = Buffer.from(signatureBase64, 'base64');
    const publicKey = crypto.createPublicKey(publicKeyPem);

    if (keyType === 'ed25519') {
      return crypto.verify(null, Buffer.from(canonical), publicKey, signature);
    }

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(canonical);
    verify.end();
    return verify.verify(publicKey, signature);
  } catch (error) {
    console.error('verifySignature error:', error);
    return false;
  }
}

module.exports = {
  verifySignature,
  canonicalizeCertificate,
};
