-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "gallery" JSONB,
ADD COLUMN     "placeId" VARCHAR(255),
ADD COLUMN     "tagline" VARCHAR(120);

-- CreateIndex
CREATE UNIQUE INDEX "Business_placeId_key" ON "Business"("placeId");