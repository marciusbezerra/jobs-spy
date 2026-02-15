-- CreateTable
CREATE TABLE `Job` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `status` ENUM('NEW', 'DISCARDED', 'APPLIED', 'REJECTED', 'INTERVIEWING', 'IN_CONTACT', 'SEE_LATER') NOT NULL DEFAULT 'NEW',
    `description` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `salaryMin` DOUBLE NULL,
    `salaryMax` DOUBLE NULL,
    `remote` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
