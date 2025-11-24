import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const issuer = await prisma.issuer.upsert({
    where: { domain: 'acme.edu' },
    update: {},
    create: {
      legalName: 'Acme University',
      domain: 'acme.edu',
      contactEmail: 'admin@acme.edu',
      status: 'VERIFIED',
    },
  });

  await prisma.issuerKey.create({
    data: {
      issuerId: issuer.id,
      publicKey: '-----BEGIN PUBLIC KEY-----...-----END PUBLIC KEY-----',
      keyType: 'ed25519',
      fingerprint: 'acme-ed25519-v1',
    },
  });

  await prisma.auth.create({
    data: {
      issuerId: issuer.id,
      email: 'issuer@acme.edu',
      passwordHash: await argon2.hash('ChangeMe123!'),
    },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
