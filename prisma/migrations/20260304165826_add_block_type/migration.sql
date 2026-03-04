-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('EXERCISE', 'SUPERSET', 'REST', 'NOTE');

-- DropForeignKey
ALTER TABLE "workout_blocks" DROP CONSTRAINT "workout_blocks_exerciseId_fkey";

-- AlterTable
ALTER TABLE "workout_blocks" ADD COLUMN     "type" "BlockType" NOT NULL DEFAULT 'EXERCISE',
ALTER COLUMN "exerciseId" DROP NOT NULL,
ALTER COLUMN "sets" SET DEFAULT 0,
ALTER COLUMN "reps" SET DEFAULT '',
ALTER COLUMN "restSeconds" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "workout_blocks" ADD CONSTRAINT "workout_blocks_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
