/*
  Warnings:

  - You are about to drop the column `rejectionNote` on the `lawyer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `lawyer_profiles` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `lawyer_profiles_verificationStatus_idx` ON `lawyer_profiles`;

-- AlterTable
ALTER TABLE `lawyer_profiles` DROP COLUMN `rejectionNote`,
    DROP COLUMN `verificationStatus`;
