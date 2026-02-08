-- CreateEnum
CREATE TYPE "LocationKind" AS ENUM ('HOTEL', 'CEREMONY', 'PARTY', 'HOME', 'VENUE', 'OTHER');

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

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");
