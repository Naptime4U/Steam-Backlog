-- CreateEnum
CREATE TYPE "BacklogStatus" AS ENUM ('EN_ROTACION', 'COMPLETADO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "steamId" TEXT NOT NULL,
    "username" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "appid" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "headerUrl" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backlog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "status" "BacklogStatus" NOT NULL DEFAULT 'EN_ROTACION',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Backlog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_steamId_key" ON "User"("steamId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_appid_key" ON "Game"("appid");

-- CreateIndex
CREATE UNIQUE INDEX "Backlog_userId_gameId_key" ON "Backlog"("userId", "gameId");

-- AddForeignKey
ALTER TABLE "Backlog" ADD CONSTRAINT "Backlog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backlog" ADD CONSTRAINT "Backlog_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
