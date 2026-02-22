-- CreateEnum
CREATE TYPE "LocationKind" AS ENUM ('HOTEL', 'CEREMONY', 'PARTY', 'HOME', 'VENUE', 'OTHER');

-- CreateEnum
CREATE TYPE "PersonRole" AS ENUM ('GUEST', 'TOASTMASTER', 'PERSON_OF_HONOR', 'VENDOR', 'SPOUSE_TO_BE');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('YES', 'NO');

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "text" VARCHAR(280) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" "LocationKind" NOT NULL DEFAULT 'VENUE',
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "url" TEXT,
    "emoji" VARCHAR(8),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "friendlyName" TEXT NOT NULL,
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
    "imagePath" TEXT,
    "thumbPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_slug_key" ON "ContentBlock"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");
