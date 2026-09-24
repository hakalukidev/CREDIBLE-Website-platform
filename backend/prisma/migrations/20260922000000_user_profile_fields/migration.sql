-- ============================================================
-- Phase 6 — Public user profile fields + join tables
--
-- Extends the `User` table with public-profile fields (username,
-- slug, cover image/colour, headline, bio, location, website,
-- isHireable) and adds four join tables for the social links,
-- skills, experience, and education lists shown on
-- `/profile/[username]`.
-- ============================================================

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "username"   TEXT,
  ADD COLUMN "slug"       TEXT,
  ADD COLUMN "coverImage" TEXT,
  ADD COLUMN "coverColor" TEXT,
  ADD COLUMN "headline"   TEXT,
  ADD COLUMN "bio"        TEXT,
  ADD COLUMN "location"   TEXT,
  ADD COLUMN "website"    TEXT,
  ADD COLUMN "isHireable" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_slug_key"     ON "User"("slug");
CREATE INDEX "User_username_idx"       ON "User"("username");
CREATE INDEX "User_slug_idx"           ON "User"("slug");

-- CreateTable: UserSocialLink
CREATE TABLE "UserSocialLink" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "platform"  TEXT         NOT NULL,
  "url"       TEXT         NOT NULL,
  "position"  INTEGER      NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSocialLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserSocialLink_userId_position_idx" ON "UserSocialLink"("userId", "position");

ALTER TABLE "UserSocialLink"
  ADD CONSTRAINT "UserSocialLink_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: UserSkill
CREATE TABLE "UserSkill" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "label"     TEXT         NOT NULL,
  "position"  INTEGER      NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserSkill_userId_position_idx" ON "UserSkill"("userId", "position");

ALTER TABLE "UserSkill"
  ADD CONSTRAINT "UserSkill_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: UserExperience
CREATE TABLE "UserExperience" (
  "id"          TEXT         NOT NULL,
  "userId"      TEXT         NOT NULL,
  "role"        TEXT         NOT NULL,
  "company"     TEXT         NOT NULL,
  "logoUrl"     TEXT,
  "startDate"   TIMESTAMP(3) NOT NULL,
  "endDate"     TIMESTAMP(3),
  "description" TEXT,
  "position"    INTEGER      NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserExperience_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserExperience_userId_position_idx" ON "UserExperience"("userId", "position");

ALTER TABLE "UserExperience"
  ADD CONSTRAINT "UserExperience_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: UserEducation
CREATE TABLE "UserEducation" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "school"    TEXT         NOT NULL,
  "detail"    TEXT,
  "startYear" INTEGER,
  "endYear"   INTEGER,
  "position"  INTEGER      NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserEducation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserEducation_userId_position_idx" ON "UserEducation"("userId", "position");

ALTER TABLE "UserEducation"
  ADD CONSTRAINT "UserEducation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
