const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const verificationController = require('../controllers/verificationController');
const certificatesRouter = require('./certificates');
const authRouter = require('./auth');
const keysRouter = require('./keys');

// Issue a new certificate
router.post('/issue', certificateController.issueCertificate);

// Verify a certificate
router.post('/verify', certificateController.verifyCertificate);

// Get the entire blockchain
router.get('/chain', certificateController.getBlockchain);

// Company verification flow
router.post('/verification/send-otp', verificationController.sendOtp);
router.post('/verification/verify-otp', verificationController.verifyOtp);

// Certificate issuance
router.use('/certificates', certificatesRouter);

// Auth
router.use('/auth', authRouter);

// Keys
router.use('/keys', keysRouter);

module.exports = router;
