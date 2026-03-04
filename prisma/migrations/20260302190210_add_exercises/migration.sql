-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "muscleGroup" TEXT NOT NULL,
    "equipment" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercises_organizationId_idx" ON "exercises"("organizationId");

-- CreateIndex
CREATE INDEX "exercises_muscleGroup_idx" ON "exercises"("muscleGroup");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
