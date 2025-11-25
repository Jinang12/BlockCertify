const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const issuer = await prisma.issuer.upsert({
    where: { domain: 'seed.acme.test' },
    update: {},
    create: {
      id: 'seed-issuer',
      legalName: 'Seeded Acme University',
      domain: 'seed.acme.test',
      contactEmail: 'security@seed.acme.test',
      status: 'VERIFIED',
    },
  });

  const issuerKey = await prisma.issuerKey.upsert({
    where: { id: 'seed-issuer-key' },
    update: {},
    create: {
      id: 'seed-issuer-key',
      issuerId: issuer.id,
      publicKey: '-----BEGIN PUBLIC KEY-----SEEDDATA-----END PUBLIC KEY-----',
      keyType: 'ed25519',
      rotated: false,
      reason: 'Seed data for Render sanity checks',
    },
  });

  const authUser = await prisma.auth.upsert({
    where: {
      issuerId_email: {
        issuerId: issuer.id,
        email: 'admin@seed.acme.test',
      },
    },
    update: {},
    create: {
      issuerId: issuer.id,
      email: 'admin@seed.acme.test',
      passwordHash: await argon2.hash('SeedPassword#123'),
    },
  });

  const certificate = await prisma.certificate.upsert({
    where: { id: 'seed-certificate-record' },
    update: {},
    create: {
      id: 'seed-certificate-record',
      issuerId: issuer.id,
      issuerKeyId: issuerKey.id,
      certificateId: 'SEED-CERT-0001',
      certificateJson: {
        studentName: 'Jane Seed',
        course: 'Blockchain Security 101',
        issuedBy: issuer.legalName,
      },
      canonicalHash: 'seed-canonical-hash',
      pdfHash: 'seed-pdf-hash',
      signature: 'seed-signature',
      status: 'VALID',
      issuedAt: new Date('2024-01-01T00:00:00Z'),
      verificationUrl: 'https://example.com/verify/seed-cert',
    },
  });

  await prisma.certificateEvent.upsert({
    where: { id: 'seed-certificate-event' },
    update: {},
    create: {
      id: 'seed-certificate-event',
      certificateId: certificate.id,
      issuerId: issuer.id,
      eventType: 'ISSUED',
      payload: { note: 'Seed issuance event' },
      prevEventHash: null,
      eventHash: 'seed-event-hash',
    },
  });

  await prisma.verificationLog.create({
    data: {
      issuerId: issuer.id,
      certificateId: certificate.id,
      verdict: 'VALID',
      reason: 'Seed verification request',
      requestMetadata: { requester: 'seed-script', authUser: authUser.email },
    },
  });

  console.info('Seed data inserted for Issuer, IssuerKey, Auth, Certificate, CertificateEvent, and VerificationLog.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
