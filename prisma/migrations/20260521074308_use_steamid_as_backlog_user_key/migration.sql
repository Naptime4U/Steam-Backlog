/*
  Warnings:

  - You are about to drop the column `userId` on the `Backlog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userSteamId,gameId]` on the table `Backlog` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userSteamId` to the `Backlog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Backlog" DROP CONSTRAINT "Backlog_userId_fkey";

-- DropIndex
DROP INDEX "Backlog_userId_gameId_key";

-- AlterTable
ALTER TABLE "Backlog" DROP COLUMN "userId",
ADD COLUMN     "userSteamId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Backlog_userSteamId_gameId_key" ON "Backlog"("userSteamId", "gameId");

-- AddForeignKey
ALTER TABLE "Backlog" ADD CONSTRAINT "Backlog_userSteamId_fkey" FOREIGN KEY ("userSteamId") REFERENCES "User"("steamId") ON DELETE RESTRICT ON UPDATE CASCADE;
