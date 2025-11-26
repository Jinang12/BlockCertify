const crypto = require('crypto');
const nodemailer = require('nodemailer');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const argon2 = require('argon2');
const { generateCompanyKeypair, upsertCompany } = require('../services/companyService');

const otpStore = new Map();

const brevoApiKey = process.env.BREVO_API_KEY || process.env.BREVO_API_V3_KEY;
let brevoClient = null;

if (brevoApiKey) {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  defaultClient.authentications['api-key'].apiKey = brevoApiKey;
  brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
}

const hasSmtpCreds = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const fallbackMailer = hasSmtpCreds
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

const parseSender = () => {
  const raw = process.env.MAIL_FROM || 'no-reply@blockcertify.local';
  const fallbackName = process.env.MAIL_FROM_NAME || 'BlockCertify';
  const match = raw.match(/^(.*)<([^>]+)>$/);
  if (match) {
    const [, name, email] = match;
    return {
      email: email.trim(),
      name: name.trim().replace(/"/g, '') || fallbackName,
      display: raw,
    };
  }

  return {
    email: raw.trim().replace(/"/g, ''),
    name: fallbackName,
    display: raw,
  };
};

const sendOtpEmail = async (email, otp, companyName) => {
  const sender = parseSender();
  const senderEmail = sender.email;
  const senderName = sender.name;
  const subject = 'Verify your organization – BlockCertify';
  const textContent = `Hi${companyName ? ` ${companyName}` : ''}, your verification code is ${otp}. It expires in 10 minutes.`;
  const htmlContent = `<p>Hi${companyName ? ` ${companyName}` : ''},</p><p>Your BlockCertify verification code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`;

  if (brevoClient) {
    try {
      await brevoClient.sendTransacEmail({
        sender: { name: senderName, email: senderEmail },
        to: [{ email, name: companyName || email }],
        subject,
        textContent,
        htmlContent,
      });
      return;
    } catch (error) {
      console.error('Brevo transactional email failed:', error?.response?.body || error);
    }
  }

  await fallbackMailer.sendMail({
    from: sender.display,
    to: email,
    subject,
    text: textContent,
    html: htmlContent,
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

    if (!brevoClient) {
      console.log('OTP email (dev preview):', { officialEmail, otp, referenceId });
    } else if (!hasSmtpCreds) {
      console.log('Brevo failed, preview fallback email:', { officialEmail, otp, referenceId });
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
