-- AlterTable
ALTER TABLE "Person" ADD COLUMN "firstSeen" TIMESTAMP(3),
ADD COLUMN "lastSeen" TIMESTAMP(3),
ADD COLUMN "rsvpUpdatedAt" TIMESTAMP(3);