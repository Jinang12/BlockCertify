const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');

// Issue a new certificate
router.post('/issue', certificateController.issueCertificate);

// Verify a certificate
router.post('/verify', certificateController.verifyCertificate);

// Get the entire blockchain
router.get('/chain', certificateController.getBlockchain);

module.exports = router;
