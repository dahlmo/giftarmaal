-- AlterTable Post: widen text column and add authorName
ALTER TABLE "Post" ALTER COLUMN "text" TYPE TEXT;
ALTER TABLE "Post" ADD COLUMN "authorName" TEXT NOT NULL DEFAULT 'Brudeparet';

-- CreateTable PostReaction
CREATE TABLE "PostReaction" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "invitationCode" TEXT NOT NULL,
    "emoji" VARCHAR(8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable PostView
CREATE TABLE "PostView" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "invitationCode" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_postId_invitationCode_emoji_key" ON "PostReaction"("postId", "invitationCode", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "PostView_postId_invitationCode_key" ON "PostView"("postId", "invitationCode");

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostView" ADD CONSTRAINT "PostView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
