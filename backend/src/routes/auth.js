const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get("/debug-env", (req, res) => {
    return res.json({
        privateKeyStartsWith: process.env.PRIVATE_KEY?.substring(0, 30),
        publicKeyStartsWith: process.env.PUBLIC_KEY?.substring(0, 30),
        privateKeyLength: process.env.PRIVATE_KEY?.length || 0,
        publicKeyLength: process.env.PUBLIC_KEY?.length || 0,
        privateKeyHasNewlines: process.env.PRIVATE_KEY?.includes("\n") || false,
        publicKeyHasNewlines: process.env.PUBLIC_KEY?.includes("\n") || false
    });
});


module.exports = router;
