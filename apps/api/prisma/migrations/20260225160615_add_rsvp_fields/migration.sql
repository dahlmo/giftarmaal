-- AlterEnum
ALTER TYPE "RsvpStatus" ADD VALUE 'UNKNOWN';

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "dietary" TEXT;
