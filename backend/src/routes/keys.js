const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { rotateIssuerKey, getCurrentIssuerKey } = require('../services/keyService');

const router = express.Router();

router.get('/current', authMiddleware, async (req, res) => {
  try {
    const key = await getCurrentIssuerKey(req.company.companyId);
    if (!key) {
      return res.status(404).json({ error: 'No active key found' });
    }
    res.json({
      keyId: key.id,
      publicKey: key.publicKey,
      keyType: key.keyType,
      createdAt: key.createdAt,
    });
  } catch (error) {
    console.error('Fetch current key error:', error);
    res.status(500).json({ error: 'Failed to load current key' });
  }
});

router.post('/rotate', authMiddleware, async (req, res) => {
  try {
    const reason = req.body?.reason || null;
    const { privateKey, key } = await rotateIssuerKey(req.company.companyId, reason);
    res.json({
      privateKey,
      keyId: key.id,
      publicKey: key.publicKey,
      keyType: key.keyType,
      createdAt: key.createdAt,
    });
  } catch (error) {
    console.error('Rotate key error:', error);
    res.status(500).json({ error: 'Failed to rotate issuer key' });
  }
});

module.exports = router;
