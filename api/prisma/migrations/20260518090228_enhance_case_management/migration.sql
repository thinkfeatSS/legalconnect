-- AlterTable
ALTER TABLE `diary_entries` ADD COLUMN `caseId` INTEGER NULL;

-- CreateTable
CREATE TABLE `law_firms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `ownerId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `law_firms_ownerId_key`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `firm_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firmId` INTEGER NOT NULL,
    `lawyerId` INTEGER NOT NULL,
    `role` ENUM('OWNER', 'PARTNER', 'ASSOCIATE', 'PARALEGAL', 'CLERK') NOT NULL DEFAULT 'ASSOCIATE',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `firm_members_firmId_lawyerId_key`(`firmId`, `lawyerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caseNumber` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `caseType` ENUM('CIVIL', 'CRIMINAL', 'FAMILY', 'CORPORATE', 'CONSTITUTIONAL', 'PROPERTY', 'LABOUR', 'ANTI_TERRORISM', 'ACCOUNTABILITY', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `status` ENUM('OPEN', 'IN_PROGRESS', 'HEARING_SCHEDULED', 'CLOSED', 'STAYED', 'APPEALED') NOT NULL DEFAULT 'OPEN',
    `courtName` VARCHAR(191) NULL,
    `courtCity` VARCHAR(191) NULL,
    `courtProvince` ENUM('PUNJAB', 'SINDH', 'KPK', 'BALOCHISTAN', 'FEDERAL', 'AJK', 'GILGIT_BALTISTAN') NOT NULL DEFAULT 'FEDERAL',
    `courtType` ENUM('DISTRICT', 'HIGH', 'SUPREME', 'FEDERAL_SHARIAT', 'SPECIAL', 'REVENUE', 'LABOUR', 'FAMILY', 'ACCOUNTABILITY', 'OTHER') NOT NULL DEFAULT 'DISTRICT',
    `firNumber` VARCHAR(191) NULL,
    `filingDate` DATETIME(3) NULL,
    `lawyerId` INTEGER NOT NULL,
    `clientId` INTEGER NULL,
    `firmId` INTEGER NULL,
    `plaintiff` JSON NULL,
    `defendant` JSON NULL,
    `opposingCounsel` JSON NULL,
    `retainerAmount` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hearing_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caseId` INTEGER NOT NULL,
    `hearingDate` DATETIME(3) NOT NULL,
    `courtRoom` VARCHAR(191) NULL,
    `judge` VARCHAR(191) NULL,
    `status` ENUM('SCHEDULED', 'HELD', 'ADJOURNED', 'CANCELLED', 'PART_HEARD') NOT NULL DEFAULT 'SCHEDULED',
    `outcome` TEXT NULL,
    `nextHearingDate` DATETIME(3) NULL,
    `orderText` TEXT NULL,
    `orderDocUrl` VARCHAR(191) NULL,
    `googleCalendarEventId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caseId` INTEGER NOT NULL,
    `uploadedById` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NULL,
    `fileSizeBytes` INTEGER NULL,
    `category` ENUM('PETITION', 'AFFIDAVIT', 'EVIDENCE', 'CONTRACT', 'COURT_ORDER', 'FIR', 'BAIL_ORDER', 'JUDGMENT', 'POWER_OF_ATTORNEY', 'VAKALATNAMA', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `isSharedWithClient` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `e_signature_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER NOT NULL,
    `requestedById` INTEGER NOT NULL,
    `requestedToId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'SIGNED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `signatureImageUrl` TEXT NULL,
    `signedAt` DATETIME(3) NULL,
    `declinedReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `diary_entries` ADD CONSTRAINT `diary_entries_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `law_firms` ADD CONSTRAINT `law_firms_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `firm_members` ADD CONSTRAINT `firm_members_firmId_fkey` FOREIGN KEY (`firmId`) REFERENCES `law_firms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `firm_members` ADD CONSTRAINT `firm_members_lawyerId_fkey` FOREIGN KEY (`lawyerId`) REFERENCES `lawyer_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cases` ADD CONSTRAINT `cases_lawyerId_fkey` FOREIGN KEY (`lawyerId`) REFERENCES `lawyer_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cases` ADD CONSTRAINT `cases_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cases` ADD CONSTRAINT `cases_firmId_fkey` FOREIGN KEY (`firmId`) REFERENCES `law_firms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hearing_entries` ADD CONSTRAINT `hearing_entries_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case_documents` ADD CONSTRAINT `case_documents_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case_documents` ADD CONSTRAINT `case_documents_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `e_signature_requests` ADD CONSTRAINT `e_signature_requests_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `case_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `e_signature_requests` ADD CONSTRAINT `e_signature_requests_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `e_signature_requests` ADD CONSTRAINT `e_signature_requests_requestedToId_fkey` FOREIGN KEY (`requestedToId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
