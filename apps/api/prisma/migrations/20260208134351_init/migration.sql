/*
 Warnings:
 
 - You are about to drop the `AgendaItem` table. If the table is not empty, all the data it contains will be lost.
 
 */
-- DropTable
DROP TABLE "AgendaItem";

-- CreateTable
CREATE TABLE "ProgramItem" (
    "id" SERIAL NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "order" INTEGER NOT NULL,
    CONSTRAINT "ProgramItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "image" TEXT,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticalInfo" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "transport" TEXT,
    "overnight" TEXT,
    "dresscode" TEXT,
    "faqs" JSONB,
    CONSTRAINT "PracticalInfo_pkey" PRIMARY KEY ("id")
);