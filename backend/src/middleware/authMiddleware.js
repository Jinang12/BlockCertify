const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getCompanyById } = require('../services/companyService');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token missing' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ error: 'Authorization token missing' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const payload = jwt.verify(token, secret);
    const company = await getCompanyById(payload.companyId);

    if (!company || !company.verified) {
      return res.status(401).json({ error: 'Invalid or inactive company' });
    }

    await prisma.$executeRaw`SELECT set_config('app.current_issuer', ${company.companyId}::text, true)`;

    req.company = company;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
