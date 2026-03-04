-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('TEMPLATE', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('COMPLETED', 'PARTIAL', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('STREAK_7', 'STREAK_30', 'FIRST_CHECKIN', 'PERFECT_WEEK');

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "status" "PlanStatus" NOT NULL DEFAULT 'TEMPLATE',
    "durationWeeks" INTEGER NOT NULL,
    "clientId" TEXT,
    "createdById" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_days" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_blocks" (
    "id" TEXT NOT NULL,
    "workoutDayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "restSeconds" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "CheckInStatus" NOT NULL,
    "workoutDayId" TEXT,
    "completedBlocks" INTEGER NOT NULL,
    "totalBlocks" INTEGER NOT NULL,
    "notes" TEXT,
    "durationMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plans_organizationId_idx" ON "plans"("organizationId");

-- CreateIndex
CREATE INDEX "plans_clientId_idx" ON "plans"("clientId");

-- CreateIndex
CREATE INDEX "plans_createdById_idx" ON "plans"("createdById");

-- CreateIndex
CREATE INDEX "workout_days_planId_idx" ON "workout_days"("planId");

-- CreateIndex
CREATE INDEX "workout_blocks_workoutDayId_idx" ON "workout_blocks"("workoutDayId");

-- CreateIndex
CREATE INDEX "workout_blocks_exerciseId_idx" ON "workout_blocks"("exerciseId");

-- CreateIndex
CREATE INDEX "check_ins_clientId_idx" ON "check_ins"("clientId");

-- CreateIndex
CREATE INDEX "check_ins_date_idx" ON "check_ins"("date");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_clientId_date_key" ON "check_ins"("clientId", "date");

-- CreateIndex
CREATE INDEX "achievements_clientId_idx" ON "achievements"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_clientId_type_key" ON "achievements"("clientId", "type");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_blocks" ADD CONSTRAINT "workout_blocks_workoutDayId_fkey" FOREIGN KEY ("workoutDayId") REFERENCES "workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_blocks" ADD CONSTRAINT "workout_blocks_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_workoutDayId_fkey" FOREIGN KEY ("workoutDayId") REFERENCES "workout_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
