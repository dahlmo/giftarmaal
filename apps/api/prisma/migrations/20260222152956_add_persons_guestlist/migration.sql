-- CreateEnum
CREATE TYPE "PersonRole" AS ENUM ('GUEST', 'TOASTMASTER', 'PERSON_OF_HONOR', 'PARENT', 'VENDOR');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('YES', 'NO');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "invitationCode" TEXT,
    "addressLine1" TEXT,
    "zipcode" TEXT,
    "city" TEXT,
    "country" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Guest',
    "roles" "PersonRole"[],
    "rsvp" "RsvpStatus" NOT NULL DEFAULT 'NO',
    "saveTheDateSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);
