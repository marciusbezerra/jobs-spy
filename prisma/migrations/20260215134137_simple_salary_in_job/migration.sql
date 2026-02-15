/*
  Warnings:

  - You are about to drop the column `salaryMax` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `salaryMin` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Job` DROP COLUMN `salaryMax`,
    DROP COLUMN `salaryMin`,
    ADD COLUMN `salary` VARCHAR(191) NULL;
