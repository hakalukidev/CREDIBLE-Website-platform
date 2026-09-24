-- Add marketing-only fields to SubscriptionPlanInfo so admins can
-- control the pricing section on /for-business and /for-professionals.
--
-- Existing rows default to `audience = ALL` so they keep appearing on
-- both surfaces after the migration.

-- CreateEnum
CREATE TYPE "PlanAudience" AS ENUM ('ALL', 'BUSINESS', 'PROFESSIONAL');

-- AlterTable
ALTER TABLE "SubscriptionPlanInfo"
  ADD COLUMN "highlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "ctaLabel" TEXT,
  ADD COLUMN "audience" "PlanAudience" NOT NULL DEFAULT 'ALL';
