const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  try {
    const issuers = await prisma.issuer.findMany({
      select: { id: true, legalName: true, domain: true, contactEmail: true, status: true, createdAt: true },
    });
    console.table(issuers);
  } finally {
    await prisma.$disconnect();
  }
})();
