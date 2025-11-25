const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const argon2 = require('argon2');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

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
router.get('/debug-env', (req, res) => {
    return res.json({
        envLoaded: true,
        jwtSecretSet: !!process.env.JWT_SECRET,
        dbUrlStartsWith: process.env.DATABASE_URL?.substring(0, 20),
    });
});
// ---------- TEST REGISTER ----------
router.post('/test-register', async (req, res) => {
  try {
    const { email, password, companyName } = req.body;

    const hash = await argon2.hash(password);

    const company = await prisma.company.create({
      data: {
        email,
        companyName: companyName || "Test Company",
        domain: "test.com",
        verified: true,
        passwordHash: hash
      }
    });

    res.json({ message: "Company created", company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create test company" });
  }
});

// ---------- TEST LOGIN ----------
router.post('/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await prisma.company.findUnique({
      where: { email }
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const ok = await argon2.verify(company.passwordHash, password);
    if (!ok) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign({ companyId: company.companyId }, process.env.JWT_SECRET);

    res.json({ message: "Login OK", token, company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed login" });
  }
});


module.exports = router;
