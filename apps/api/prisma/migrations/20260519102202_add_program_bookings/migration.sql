-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BOOKED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ProgramEntry" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "bookableFrom" TIMESTAMP(3),
    "bookableTo" TIMESTAMP(3),
    "bookableSlots" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramBooking" (
    "id" SERIAL NOT NULL,
    "programEntryId" INTEGER NOT NULL,
    "personId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'BOOKED',
    "personRole" "PersonRole" NOT NULL DEFAULT 'GUEST',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramEntry_slug_key" ON "ProgramEntry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramBooking_programEntryId_personId_key" ON "ProgramBooking"("programEntryId", "personId");

-- AddForeignKey
ALTER TABLE "ProgramBooking" ADD CONSTRAINT "ProgramBooking_programEntryId_fkey" FOREIGN KEY ("programEntryId") REFERENCES "ProgramEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramBooking" ADD CONSTRAINT "ProgramBooking_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
