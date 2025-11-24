const crypto = require('crypto');
const nodemailer = require('nodemailer');
const argon2 = require('argon2');
const { generateCompanyKeypair, upsertCompany } = require('../services/companyService');

const otpStore = new Map();

const hasSmtpCreds = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const mailer = hasSmtpCreds
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const sendOtpEmail = async (email, otp, companyName) => {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await mailer.sendMail({
    from,
    to: email,
    subject: 'Verify your organization – BlockCertify',
    text: `Hi${companyName ? ` ${companyName}` : ''}, your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Hi${companyName ? ` ${companyName}` : ''},</p><p>Your BlockCertify verification code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  });
};

exports.sendOtp = async (req, res) => {
  try {
    const { companyName, domain, officialEmail, password } = req.body;

    if (!companyName || !domain || !officialEmail || !password) {
      return res.status(400).json({ success: false, message: 'companyName, domain, officialEmail, and password are required' });
    }

    const [, emailDomain = ''] = officialEmail.split('@');
    if (emailDomain.toLowerCase() !== domain.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Email domain must match company domain' });
    }

    const otp = generateOtp();
    const referenceId = crypto.randomUUID();

    otpStore.set(referenceId, {
      otp,
      officialEmail,
      password,
      companyName,
      domain,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });

    await sendOtpEmail(officialEmail, otp, companyName);

    if (!hasSmtpCreds) {
      const preview = mailer.transporter ? mailer.transporter.mailer : mailer;
      console.log('OTP email (dev preview):', { officialEmail, otp, referenceId });
    }

    res.status(200).json({ success: true, referenceId });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification email' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { referenceId, otp } = req.body;

    if (!referenceId || !otp) {
      return res.status(400).json({ success: false, message: 'referenceId and otp are required' });
    }

    const entry = otpStore.get(referenceId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Verification session not found or expired' });
    }

    if (entry.expiresAt < Date.now()) {
      otpStore.delete(referenceId);
      return res.status(410).json({ success: false, message: 'OTP expired, request a new code' });
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      otpStore.delete(referenceId);
      return res.status(429).json({ success: false, message: 'Too many attempts, request a new code' });
    }

    if (entry.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const keyPair = generateCompanyKeypair();

    const passwordHash = await argon2.hash(entry.password);

    const companyRecord = await upsertCompany({
      companyName: entry.companyName,
      domain: entry.domain,
      email: entry.officialEmail,
      passwordHash,
      verified: true,
      publicKeyPem: keyPair.publicKeyPem,
      keyType: keyPair.keyType,
    });

    otpStore.delete(referenceId);
    res.status(200).json({
      success: true,
      companyId: companyRecord.companyId,
      companyName: companyRecord.companyName,
      officialEmail: companyRecord.email,
      domain: companyRecord.domain,
      keyPair,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};
