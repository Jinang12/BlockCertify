const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const { getCompanyByEmail } = require('../services/companyService');

function signToken(companyId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { companyId },
    secret,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const company = await getCompanyByEmail(email);
    if (!company || !company.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!company.verified) {
      return res.status(403).json({ error: 'Company is not verified' });
    }

    const passwordMatch = await argon2.verify(company.passwordHash, password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(company.companyId);

    res.json({
      token,
      company: {
        companyId: company.companyId,
        companyName: company.companyName,
        domain: company.domain,
        email: company.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};
