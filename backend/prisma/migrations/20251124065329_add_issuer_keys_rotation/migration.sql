/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `IssuerKey` table. All the data in the column will be lost.
  - You are about to drop the column `fingerprint` on the `IssuerKey` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `IssuerKey` table. All the data in the column will be lost.
  - You are about to drop the column `rotatedAt` on the `IssuerKey` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `IssuerKey` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "IssuerKey_fingerprint_key";

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "issuerKeyId" TEXT;

-- AlterTable
ALTER TABLE "IssuerKey" DROP COLUMN "deletedAt",
DROP COLUMN "fingerprint",
DROP COLUMN "isActive",
DROP COLUMN "rotatedAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "rotated" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_issuerKeyId_fkey" FOREIGN KEY ("issuerKeyId") REFERENCES "IssuerKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
